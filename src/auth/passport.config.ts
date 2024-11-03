import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import { userApi } from "../mongo/api/user";
import { User } from "../interfaces/user";
import { ENV } from "../../config";
import { BagpipeTypes } from "../interfaces/song";
import { Languages } from "../interfaces/common";
import { logger } from "../../logger"; // Import your logger

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
            console.log("Google profile does not contain an email.");
            throw new Error("User does not have email");
          }

          // Log profile data for debugging
          console.log("Received Google profile", { email: profile._json.email, name: profile._json.name });

          let user = await userApi.getUserByEmail(profile._json.email);

          if (user) {
            console.log("User found, logging in", { userId: user._id, email: user.email });
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
            console.log("New user created", { userId: user._id, email: user.email });
            done(null, user);
          }
        } catch (err: any) {
          console.log("Error in Google strategy", { error: err });
          done(err);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser(function (user: Express.User, done) {
    console.log("Serializing user", { user });
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser(function (user: Express.User, done) {
    console.log("Deserializing user", { user });
    done(null, user);
  });
}
