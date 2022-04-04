/* eslint-disable no-underscore-dangle */
import { validationResult } from 'express-validator';

import User from '../Models/User';
import StandUpHelpers from '../utils/StandUpHelpers';

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
        .select('standups configs.timeZone')
        .lean();

      if (!user) throw new Error('User is not found.');
      if (
        req.body.user.configs.timeZone !== user.configs.timeZone
        && user.standups.length !== 0
      ) {
        user.configs.timeZone = req.body.user.configs.timeZone;
        StandUpHelpers.updateStandUpRemindersByUser(
          user,
          user.standups,
          true,
          true,
          true,
        );
      }

      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { configs: req.body.user.configs },
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
