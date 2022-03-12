import User from '../Models/User.js';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
import path from 'path';


function genToken( user ) {
    return jwt.sign({
      iss: 'standupman_api',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1)
    }, process.env.JWT_SECRET_KEY);
  }

export default {
    login: (req, res) => {
       // res.json({username: req.body.username, password: req.body.password});
       let user = Object.assign({}, req.user)._doc;
       delete user.password;
       const token = genToken(user);
       res.status(200).json({token});
    },
    logout: (req, res) => {
        req.logout();
        res.redirect('/');
    },
    createUser: (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const email = req.body.user.email;
        User.findOne({ email }).then((user) => {
            if (user) {
                return res.status(403).json({ error: 'Email is already in use'});
            }
            let newUser = req.body.user;
            let salt = bcrypt.genSaltSync(10);
            newUser.password = bcrypt.hashSync(newUser.password, salt);
            User.create(newUser).then(user => {
                const token = genToken(user);
                res.status(200).json({token});
            }).catch(errors => {
                res.json({message: "User not created", errors:errors});
            });
        });
     }
};
