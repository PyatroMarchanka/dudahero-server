import express from "express";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./src/auth/authRouter";
import { useGoogleStrategy } from "./src/auth/passport.config";
import { ENV } from "./config";
import { userApi } from "./src/mongo/api/user";
import cors, { CorsOptions } from "cors";
import bodyParser from "body-parser";
import { jwtAuth } from "./src/middleware/jwtAuth";
import morgan from "morgan";
import { logger } from "./src/utils/logger";

const app = express();
const port = parseInt(process.env.BACKEND_PORT || "3000", 10);
const host =
  process.env.BACKEND_HOST || (ENV.IS_DEV ? "localhost" : "127.0.0.1");
const frontendUrl = ENV.IS_DEV
  ? "http://localhost:3000"
  : "https://dudahero.org";

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

app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  } as CorsOptions)
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use("/v1/auth", authRouter);

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", frontendUrl);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.get("/v1/profile", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.header("userId");
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
    const userId = req.header("userId");
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
