/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from '../Models/User';

function genToken(user) {
  return jwt.sign(
    {
      iss: 'standupman_api',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    process.env.JWT_SECRET_KEY,
  );
}

export default {
  login: (req, res) => {
    User.findOne({ username: req.body.username }, (err, user) => {
      if (!user) {
        return res.status(403).json({
          message: 'Invalid credentials',
        });
      }
      if (!user.validatePassword(req.body.password)) {
        return res.status(403).json({ error: 'Incorrect password' });
      }
      if (err) {
        // eslint-disable-next-line no-console
        console.log('Error Happened In auth /token Route');
        return res.status(500).json({
          message: 'Internal Server Error',
        });
      }
      const payload = {
        sub: user.id,
      };
      const token = genToken(payload);
      return res.status(200).json({ token });
    });
  },
  logout: (req, res) => {
    req.logout();
    res.redirect('/');
  },
  createUser: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body.user;
    // eslint-disable-next-line consistent-return
    User.findOne({ email }).then((foundUser) => {
      if (foundUser) {
        return res.status(403).json({ error: 'Email is already in use' });
      }
      const { user } = req.body;
      const salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(user.password, salt);
      User.create(user)
        .then((newUser) => {
          const token = genToken(newUser);
          return res.status(200).json({ token });
        })
        .catch((e) => res.json({ message: 'User not created', e }));
    });
  },
};
