import express, { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { ENV } from "../../config";
import { ObjectId } from "mongoose";
import { logger } from "../../logger";  // Import the logger from your setup

export const authRouter: Router = express.Router();

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
      logger.error("Authentication failed: req.user is undefined");
      return res.status(500).send("Authentication error");
    }

    try {
      logger.info("Google callback received", { user: req.user });

      const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");
      logger.info("JWT token created", { token });

      res.cookie("jwtToken", token, {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: false,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      res.cookie("userId", ((req as any).user._id as ObjectId).toString(), {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: false,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      logger.info("Cookies set successfully", { userId: req.user?._id });
      res.redirect(ENV.FRONTEND_URL);
    } catch (error) {
      logger.error("Error during cookie setting or redirection", { error });
      res.status(500).send("Authentication error");
    }
  }
);

authRouter.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) {
      logger.error("Logout error", { error: err });
      return next(err);
    }
    logger.info("User logged out", { userId: (req as any).user?._id });

    res.clearCookie("jwtToken");
    res.clearCookie("userId");
    res.redirect(ENV.FRONTEND_URL);
  });
});
