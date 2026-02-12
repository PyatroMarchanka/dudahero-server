import express from "express";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./src/routers/auth/auth.router";
import { useGoogleStrategy } from "./src/routers/auth/passport.config";
import { ENV } from "./config";
import { userApi } from "./src/mongo/api/user";
import cors, { CorsOptions } from "cors";
import bodyParser from "body-parser";
import { jwtAuth } from "./src/middleware/jwtAuth";
import morgan from "morgan";
import { logger } from "./src/utils/logger";
import { songRouter } from "./src/routers/song.router";
import cookieParser from "cookie-parser";
import { adminRouter } from "./src/routers/admin.router";
import { playlistRouter } from "./src/routers/playlists.router";
import articleRouter from "./src/routers/article.router";
import categoriesRouter from "./src/routers/categories.router";
import { logRoutes } from "./src/utils/logRoutes";
import { initRedisClient } from "./src/mongo/redis";

// Initialize Redis client
initRedisClient().catch((error) => {
  logger.warn("Redis initialization failed, caching disabled:", error);
});

const app = express();
const port = parseInt(process.env.BACKEND_PORT || "3000", 10);
// In Docker, listen on 0.0.0.0 to accept connections from any interface
// Only bind to localhost if explicitly set to "true"
const isDev = process.env.IS_DEV === "true";
const host = isDev ? "localhost" : "0.0.0.0";
const frontendUrl = isDev ? "http://localhost:3000" : ENV.FRONTEND_URL;
// Log HTTP requests
app.use(
  morgan("combined", {
    stream: { write: (message: any) => logger.info(message.trim()) },
  })
);

useGoogleStrategy();
const jsonParser = bodyParser.json();
app.use(
  session({
    secret: ENV.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.options("*", (req, res, next) => {
  if (ENV.IS_DEV) {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (ENV.FRONTEND_URL) {
    res.header("Access-Control-Allow-Origin", ENV.FRONTEND_URL);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, userId"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use((req, res, next) => {
  // Set CORS headers for all requests
  if (ENV.IS_DEV) {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (ENV.FRONTEND_URL) {
    res.header("Access-Control-Allow-Origin", ENV.FRONTEND_URL);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, userId"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

if (ENV.IS_DEV) {
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    } as CorsOptions)
  );
} else if (ENV.FRONTEND_URL) {
  // Add CORS for production as well
  app.use(
    cors({
      origin: ENV.FRONTEND_URL,
      credentials: true,
    } as CorsOptions)
  );
}
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cookieParser());
app.use("/v1/auth", authRouter);
app.use("/v1/songs", songRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/playlists", playlistRouter);
app.use("/v1/articles", articleRouter);
app.use("/v1/categories", categoriesRouter);

app.get("/v1/profile", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.cookies.userId;
    const user = await userApi.getUserById(userId!);
    res.send(user);
  } catch (error) {
    logger.info("Error fetching profile:", error);
    res.status(403).send(error);
  }
});

app.post("/v1/settings-update", jsonParser, async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.cookies.userId;
    const user = await userApi.updateUserSettinsById(userId!, req.body);
    res.send(user);
  } catch (error) {
    logger.info("Error updating settings:", error);
    res.status(403).send(error);
  }
});


// Log routes before starting the server
logRoutes(app);

app.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port}`);
});
