import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import { userApi } from "../../mongo/api/user";
import { defaultSetings, User } from "../../interfaces/user";
import { ENV } from "../../../config";
import { logger } from "../../utils/logger";

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
        try {
          // Check for user's email in profile
          if (!profile._json.email) {
            logger.info("Google profile does not contain an email.");
            throw new Error("User does not have email");
          }

          let user = await userApi.getUserByEmail(profile._json.email);

          if (user) {
            done(null, user);
          } else {
            // Create a new user if none exists
            const newUser: User = {
              name: profile._json.name!,
              email: profile._json.email!,
              picture: profile._json.picture,
              settings: defaultSetings,
            };
            user = await userApi.addUser(newUser);
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
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser(function (user: Express.User, done) {
    done(null, user);
  });
}
