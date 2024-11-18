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

app.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port}`);
});
