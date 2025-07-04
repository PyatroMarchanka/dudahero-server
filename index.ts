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
import blogRouter from "./src/routers/blog.router";
import { logRoutes } from "./src/utils/logRoutes";

const app = express();
const port = parseInt(process.env.BACKEND_PORT || "3000", 10);
const host =
  process.env.BACKEND_HOST || (ENV.IS_DEV ? "localhost" : "127.0.0.1");
const frontendUrl = ENV.IS_DEV ? "http://localhost:3000" : ENV.FRONTEND_URL;
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
    console.log("Access-Control-Allow-Origin", ENV.IS_DEV);
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, userId"
    );
  } else {
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use((req, res, next) => {
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
}
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(cookieParser());
app.use("/v1/auth", authRouter);
app.use("/v1/songs", songRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/playlists", playlistRouter);
app.use("/v1/blog", blogRouter);

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
