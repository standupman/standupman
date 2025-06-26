/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

function genToken(user) {
  return jwt.sign(
    {
      iss: 'standupman_api',
      sub: user._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      algorithm: 'HS256',
      expiresIn: '1d',
    },
  );
}

export default {
  login: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user || !user.validatePassword(req.body.password)) {
        return res.status(403).json({
          message: 'Invalid credentials',
        });
      }
      const token = genToken(user);
      return res.status(200).json({ token });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Error Happened In auth /token Route', err);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  },
  logout: (req, res) => {
    req.logout();
    res.redirect('/');
  },
  createUser: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { user } = req.body;
      const foundUser = await User.findOne({ email: user.email });
      if (foundUser) {
        return res.status(403).json({ error: 'Email is already in use' });
      }

      const salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(user.password, salt);

      const newUser = await User.create(user);
      const token = genToken(newUser);
      return res.status(200).json({ token });
    } catch (e) {
      return res.status(500).json({ message: 'User not created', error: e.message });
    }
  },
};
