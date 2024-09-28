import express from "express";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./src/auth/authRouter";
import { useGoogleStrategy } from "./src/auth/passport.config";
import { jwtAuth } from "./src/middleware/ jwtAuth";
import { ENV } from "./config";
import { userApi } from "./src/mongo/api/user";
import cors, { CorsOptions } from "cors";
import bodyParser from "body-parser";

const app = express();
const port = process.env.BACKEND_PORT;

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
    origin: "https://dudahero.org",
    credentials: true,
    sameSite: "none",
    exposedHeaders: ["Set-Cookie"],
  } as CorsOptions)
);
app.set("trust proxy", 1);

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
    console.log(error);
    res.status(403);
    res.send(error);
  }
});

app.post("/v1/settings-update", jsonParser, async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.header("userId");
    const user = await userApi.updateUserSettinsById(userId!, req.body);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(403);
    res.send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
