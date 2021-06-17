const User = require('../Models/User');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

module.exports = passport.use(new BasicStrategy(
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