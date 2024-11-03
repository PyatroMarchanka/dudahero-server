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
    console.log("Initiating Google authentication");
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    if (!req.user) {
      console.log("Authentication failed: req.user is undefined");
      return res.status(500).send("Authentication error");
    }

    try {
      console.log("Google callback received", { user: req.user });

      // Create JWT token and log it
      const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");
      console.log("JWT token created", { token });  // Log the token for testing

      // Extract and log user ID
      const userId = (req.user as any)._id.toString();
      console.log("User ID extracted", { userId });

      // Set cookies with the token and user ID
      res.cookie("jwtToken", token, {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: false,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      res.cookie("userId", userId, {
        maxAge: 1000 * 60 * 60 * 128,
        httpOnly: false,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      console.log("Cookies set successfully", { jwtToken: token, userId });
      res.redirect(ENV.FRONTEND_URL);
    } catch (error) {
      console.log("Error during cookie setting or redirection", { error });
      res.status(500).send("Authentication error");
    }
  }
);

authRouter.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) {
      console.log("Logout error", { error: err });
      return next(err);
    }
    console.log("User logged out", { userId: (req as any).user?._id });

    res.clearCookie("jwtToken");
    res.clearCookie("userId");
    res.redirect(ENV.FRONTEND_URL);
  });
});
