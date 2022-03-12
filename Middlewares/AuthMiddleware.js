import User from '../Models/User.js';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'secret';

export default passport.use(new Strategy(opts, function(jwt_payload, done) {
  User.findOne({id: jwt_payload.sub}, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false); }
    if (!user.validatePassword(password)) { return done(null, false); }
    return done(null, user);
  });
}));