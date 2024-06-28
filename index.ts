import express from "express";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./src/auth/authRouter";
import { useGoogleStrategy } from "./src/auth/passport.config";
import { jwtAuth } from "./src/middleware/ jwtAuth";
import { ENV } from "./config";
import { userApi } from "./src/mongo/api/user";
import cors from "cors";

const app = express();
const port = 8080;

useGoogleStrategy();

app.use(
  session({
    secret: ENV.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cors({ origin: "http://localhost:3000" }));

app.use(passport.initialize());
app.use(passport.session());

app.use("/v1/auth", authRouter);

app.get("/v1/profile", async (req, res) => {
  try {
    jwtAuth(req);
    const userId = req.header("userId");
    const user = await userApi.getUserById(userId!);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
