import User from '../Models/User.js';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import passport from 'passport';

function genToken( user ) {
    return jwt.sign({
      iss: 'standupman_api',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1)
    }, process.env.API_KEY);
  }
  

export default {
    login: (req, res, next) => {
        User.findOne({ username: req.body.username}, (err, user) => {
            if (!user.validatePassword(req.body.password )) { res.status(403).json({ error: 'Incorrect password'}); }
            if (err) {
                console.log("Error Happened In auth /token Route");
            } else {
                const payload = {
                    sub: user.id,
                };
                const token = genToken(payload);
                res.status(200).json({token});
            }
          });
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
        User.findOne({ email }).then((foundUser) => {
            if (foundUser) {
                return res.status(403).json({ error: 'Email is already in use'});
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
        });
     }
};
