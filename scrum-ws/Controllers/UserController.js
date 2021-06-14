const User = require('../Models/User');
const bcrypt = require("bcrypt");

module.exports = {
    createUser  : (req, res) => {
       let user = req.body.user;
       let salt = bcrypt.genSaltSync(10);
       user.password = bcrypt.hashSync(user.password, salt);
       User.create(user).then(user => {
           res.json({user:user});
       }).catch(errors => {
           res.json({message: "User not created", errors:errors});
       });
    },

    users: (req, res) => {
      User.find().then(users => {
          res.json({users:users});
      })
    }
}