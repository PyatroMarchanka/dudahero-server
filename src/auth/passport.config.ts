import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import { userApi } from "../mongo/api/user";
import { User } from "../interfaces/user";
import { ENV } from "../../config";
import { BagpipeTypes } from "../interfaces/song";
import { Languages } from "../interfaces/common";

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
          if (!profile._json.email) throw "User does not have email";
          let user = await userApi.getUserByEmail(profile._json.email);

          if (user) {

            done(null, user);
          } else {
            const newUser: User = {
              name: profile._json.name!,
              email: profile._json.email!,
              settings: {
                tempo: 120,
                userPreclick: true,
                bagpipe: BagpipeTypes.BelarusianTraditionalDuda,
                language: Languages.English,
              },
            };
            user = await userApi.addUser(newUser);
            done(null, user);
          }
        } catch (err: any) {
          console.error(err);
          done(err);
        }
      }
    )
  );

  passport.serializeUser(function (user: Express.User, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user: Express.User, done) {
    done(null, user);
  });
}
