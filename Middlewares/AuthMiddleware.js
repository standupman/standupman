import User from '../Models/User.js';

import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.', '.env') });

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY
}

export default passport.use(new Strategy(opts, function(jwt_payload, done) {
  User.findOne({id: jwt_payload.sub}, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false); }
    return done(null, user);
  });
}));
