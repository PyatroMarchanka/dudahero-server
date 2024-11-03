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
import winston from "winston";

const app = express();
const port = parseInt(process.env.BACKEND_PORT || "3000", 10);
const host = process.env.BACKEND_HOST || "127.0.0.1";

// Set up logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Log HTTP requests
app.use(morgan('combined', { stream: { write: (message: any) => console.log(message.trim()) }}));

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

app.get("/v1/profile", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.header("userId");
    const user = await userApi.getUserById(userId!);
    res.send(user);
  } catch (error) {
    console.log("Error fetching profile:", error);
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
    console.log("Error updating settings:", error);
    res.status(403).send(error);
  }
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
