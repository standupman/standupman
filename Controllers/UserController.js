/* eslint-disable no-underscore-dangle */
import { validationResult } from 'express-validator';

import User from '../Models/User';

export default {
  users: (req, res) => {
    User.find().then((users) => {
      res.json({ users });
    });
  },

  updateUser: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({
        username: req.user.username,
      })
        .select('_id')
        .lean();

      if (!user) throw new Error('User is not found.');

      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { configs: req.body.configs },
        },
        { new: true },
      );
      return res.json({ sucess: true, user });
    } catch (e) {
      return res
        .status(404)
        .json({ message: 'Error updating user', error: e.message });
    }
  },

  subscribeToStandUp: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return res.status(200).json({});
  },
};
