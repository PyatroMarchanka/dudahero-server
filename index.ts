import express from "express";
import session from "express-session";
import passport from "passport";
import { authRouter } from "./src/auth/authRouter";
import { useGoogleStrategy } from "./src/auth/passport.config";
import { jwtAuth } from "./src/middleware/ jwtAuth";

const app = express();
const port = 8080;

useGoogleStrategy();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("v1/auth", authRouter);

app.get('/protected', (req, res) => {
    console.log('Auth test')
    jwtAuth(req);
    res.send('Auth works ! Hello World!')
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
