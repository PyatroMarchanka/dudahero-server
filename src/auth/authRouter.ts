import express, { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport'
import jwt from "jsonwebtoken";

export const authRouter: Router = express.Router();

authRouter.get(
  '/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get(
  '/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }), 
  (req: Request, res: Response) => {
    const token = jwt.sign(
      { user: req.user },
      process.env.JWT_SECRET || '',
      { expiresIn: "1h" },
    );
    res.cookie('jwtToken', token);
    res.redirect("http://localhost:3000")
  }
);

authRouter.get(
  '/logout', 
  (req: Request, res: Response, next: NextFunction) => {
    req.logout(function (err) {
      if (err) return next(err);
      res.redirect('/');
    });
  }
);