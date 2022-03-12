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
    createUser : (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        let user = req.body.user;
        let salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(user.password, salt);
        User.create(user).then(user => {
            const token = genToken(user);
            res.status(200).json({token});
        }).catch(errors => {
            res.json({message: "User not created", errors:errors});
        });
     }
};
