import express, { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { ENV } from "../../config";
import { ObjectId } from "mongoose";

export const authRouter: Router = express.Router();

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    const token = jwt.sign({ user: req.user }, ENV.JWT_SECRET || "");

    res.cookie("jwtToken", token, {
      maxAge: 1000 * 60 * 60 * 128,
      httpOnly: false,
      sameSite: ENV.NODE_ENV === "development" ? true : "none",
      secure: ENV.NODE_ENV === "development" ? false : true,
    });

    res.cookie("userId", ((req as any).user._id as ObjectId).toString(), {
      maxAge: 1000 * 60 * 60 * 128,
      httpOnly: false,
      sameSite: ENV.NODE_ENV === "development" ? true : "none",
      secure: ENV.NODE_ENV === "development" ? false : true,
    });
    res.redirect(ENV.FRONTEND_URL);
  }
);

authRouter.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.clearCookie("jwtToken");
    res.clearCookie("userId");
    res.redirect(ENV.FRONTEND_URL);
  });
});
