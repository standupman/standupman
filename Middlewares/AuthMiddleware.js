import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import { ExtractJwt, Strategy } from 'passport-jwt';

import User from '../Models/User';

dotenv.config({ path: path.resolve('.', '.env') });

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
};

export default passport.use(
  new Strategy(opts, ((jwtPayload, done) => {
    User.findOne({ _id: jwtPayload.sub }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    });
  })),
);
