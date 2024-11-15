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
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { logger } from "./src/utils/logger";
import { OAuth2Client } from "google-auth-library";
import { defaultSetings, User } from "./src/interfaces/user";

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

app.use(
  cors({
    origin: frontendUrl,
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


app.post("/some-auth", jsonParser, async (req, res) => {
  const { credential, client_id } = req.body;
  try {
    res
      .status(200)
      // .cookie("jwtToken", token, { httpOnly })
      // .cookie("userId", (user as any)._id.toString(), { httpOnly })
      .send({ user: "user" });
  } catch (err) {
    res.status(400).json({ err });
  }
});


const client = new OAuth2Client();

const httpOnly = !ENV.IS_DEV;

app.post("/google-auth", jsonParser, async (req, res) => {
  const { credential, client_id } = req.body;
  console.log(credential, client_id);
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: client_id,
    });
    console.log(ticket);
    const payload = ticket.getPayload()!;
    let user = await userApi.getUserByEmail('karotkavichy@gmail.com');
    console.log('user', user)
    if (!user) {
      // Create a new user if none exists
      const newUser: User = {
        name: payload.name!,
        email: payload.email!,
        picture: payload.picture,
        settings: defaultSetings,
      };
      user = await userApi.addUser(newUser);
    }

    const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");

    res
      .status(200)
      .cookie("jwtToken", token, { httpOnly })
      .cookie("userId", (user as any)._id.toString(), { httpOnly })
      .send({ user: "user" });
  } catch (err) {
    res.status(400).send({ err });
  }
});

app.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port}`);
});

