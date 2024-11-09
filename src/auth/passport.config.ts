import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import { userApi } from "../mongo/api/user";
import { User } from "../interfaces/user";
import { ENV } from "../../config";
import { BagpipeTypes } from "../interfaces/song";
import { Languages } from "../interfaces/common";
import { logger } from "../utils/logger";

const GoogleStrategy = passportGoogle.Strategy;

export function useGoogleStrategy() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: ENV.GOOGLE_CLIENT_ID || "",
        clientSecret: ENV.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/v1/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        logger.info("TEST LOG");
        try {
          // Check for user's email in profile
          if (!profile._json.email) {
            logger.info("Google profile does not contain an email.");
            throw new Error("User does not have email");
          }

          // Log profile data for debugging
          logger.info("Received Google profile", { email: profile._json.email, name: profile._json.name });

          let user = await userApi.getUserByEmail(profile._json.email);

          if (user) {
            logger.info("User found, logging in", { userId: (user as any)._id, email: user.email });
            done(null, user);
          } else {
            // Create a new user if none exists
            const newUser: User = {
              name: profile._json.name!,
              email: profile._json.email!,
              picture: profile._json.picture,
              settings: {
                tempo: 240,
                userPreclick: true,
                bagpipe: BagpipeTypes.BelarusianTraditionalDuda,
                language: Languages.English,
                transpose: 0,
              },
            };
            user = await userApi.addUser(newUser);
            logger.info("New user created", { userId: (user as any)._id, email: user.email });
            done(null, user);
          }
        } catch (err: any) {
          logger.info("Error in Google strategy", { error: err });
          done(err);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser(function (user: Express.User, done) {
    logger.info("Serializing user", { user });
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser(function (user: Express.User, done) {
    logger.info("Deserializing user", { user });
    done(null, user);
  });
}
