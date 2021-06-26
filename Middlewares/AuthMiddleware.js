import User from '../Models/User.js';
import passport from 'passport';
import passportHttp from 'passport-http'

const BasicStrategy = passportHttp.BasicStrategy;

export default passport.use(new BasicStrategy(
    function(username, password, done) {
      User.findOne({ username: username }, function (err, user) {
        console.log(username);
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.validatePassword(password)) { return done(null, false); }
        return done(null, user);
      });
    }
));