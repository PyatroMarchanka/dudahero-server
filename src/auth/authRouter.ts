import express, { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { ENV } from "../../config";
import { logger } from "../utils/logger";

export const authRouter: Router = express.Router();

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


      // Set cookies with the token and user ID
      res.cookie("jwtToken", token, {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "none",
        domain: '.dudahero.org',
      });

      res.cookie("userId", userId, {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "none",
        domain: '.dudahero.org',
      });

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
    logger.info("User logged out", { userId: (req as any).user?._id });

    res.clearCookie("jwtToken");
    res.clearCookie("userId");
    res.redirect(ENV.FRONTEND_URL);
  });
});
