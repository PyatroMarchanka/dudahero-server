import passport from 'passport';
import passportGoogle  from 'passport-google-oauth20'
import { userApi } from '../mongo/api/user';
import { User } from '../interfaces/user';

const GoogleStrategy = passportGoogle.Strategy;

export function useGoogleStrategy(){
    passport.use(
        new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: '/my-app/v1/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                if(!profile._json.email) throw "User does not have email";
                console.log('email', profile._json.email)
                // let user = await getUserByEmail(profile._json.email);
                let user = await userApi.getUserByEmail(profile._json.email);

                if (user) { 
                    done(null, user);
                } else { 
                    const newUser: User = {
                        name: profile._json.name!,
                        email: profile._json.email!,
                        
                    }
                    user = await userApi.addUser(newUser)
                    done(null, user);
                }
            } catch (err: any) {
                console.error(err)
                done(err)
            }
        }
        )
    );

    passport.serializeUser(function(user: Express.User, done) {
        done(null, user);
    });
      
    passport.deserializeUser(function(user: Express.User, done) {
        done(null, user);
    });
}