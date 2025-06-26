import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import dotenv from 'dotenv';
import path from 'path';
import User from '../Models/User.js';

dotenv.config({ path: path.resolve('.', '.env') });

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
  algorithms: ['HS256'],
};

export default passport.use(
  new Strategy(opts, async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.sub);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  }),
);
