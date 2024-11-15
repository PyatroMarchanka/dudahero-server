import express, { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { ENV } from "../../config";
import { logger } from "../utils/logger";
import { userApi } from "../mongo/api/user";
import { defaultSetings, User } from "../interfaces/user";

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();

const httpOnly = !ENV.IS_DEV;

export const authRouter: Router = express.Router();

authRouter.post("/google-auth", async (req, res) => {
  const { credential, client_id } = req.body;
  console.log(credential, client_id);
  try {
    // const ticket = await client.verifyIdToken({
    //   idToken: credential,
    //   audience: client_id,
    // });
    // console.log(ticket);
    // const payload = ticket.getPayload();
    let user = await userApi.getUserByEmail('karotkavichy@gmail.com');
    console.log('user', user)
    // if (!user) {
    //   // Create a new user if none exists
    //   const newUser: User = {
    //     name: payload.name!,
    //     email: payload.email!,
    //     picture: payload.picture,
    //     settings: defaultSetings,
    //   };
    //   user = await userApi.addUser(newUser);
    // }

    const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");

    res
      .status(200)
      .cookie("jwtToken", token, { httpOnly })
      .cookie("userId", (user as any)._id.toString(), { httpOnly })
      .json({ user });
  } catch (err) {
    res.status(400).json({ err });
  }
});

// Middleware to log all requests to authRouter
authRouter.use((req: Request, res: Response, next: NextFunction) => {
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
  });
  next();
});

authRouter.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    logger.info("Initiating Google authentication");
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    if (!req.user) {
      logger.info("Authentication failed: req.user is undefined");
      return res.status(500).send("Authentication error");
    }

    try {
      // Create JWT token and log it
      const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");

      // Extract and log user ID
      const userId = (req.user as any)._id.toString();

      if (ENV.IS_DEV) {
        // Set cookies with the token and user ID
        res.cookie("jwtToken", token, {
          secure: false, // Set to true if using HTTPS
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 128,
          path: "/",
        });

        res.cookie("userId", userId, {
          secure: false, // Set to true if using HTTPS
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 128,
          path: "/",
        });
      } else {
        // Set cookies with the token and user ID
        res.cookie("jwtToken", token, {
          maxAge: 1000 * 60 * 60 * 128,
          // httpOnly: false,
          secure: true,
          path: "/",
          sameSite: "none",
          domain: ".dudahero.org",
        });

        res.cookie("userId", userId, {
          maxAge: 1000 * 60 * 60 * 128,
          // httpOnly: false,
          secure: true,
          path: "/",
          sameSite: "none",
          domain: ".dudahero.org",
        });
      }

      res.redirect(ENV.FRONTEND_URL);
    } catch (error) {
      logger.info("Error during cookie setting or redirection", { error });
      res.status(500).send("Authentication error");
    }
  }
);

authRouter.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) {
      logger.info("Logout error", { error: err });
      return next(err);
    }

    res.clearCookie("jwtToken");
    res.clearCookie("userId");
    res.redirect(ENV.FRONTEND_URL);
  });
});
