import { validationResult } from 'express-validator';
import User from '../Models/User';

export default {

  users: (req, res) => {
    User.find().then((users) => {
      res.json({ users });
    });
  },

  subscribeToStandUp: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
  },
};
