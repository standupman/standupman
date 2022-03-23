import User from '../Models/User.js';
import StandUpHelpers from '../utils/StandUpHelpers.js';

import { validationResult } from 'express-validator';

export default {
  users: (req, res) => {
    User.find().then((users) => {
      res.json({ users: users });
    });
  },

  updateUser: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var user = await User.findOne({
        username: req.user.username,
      })
        .select("standups configs.timeZone")
        .lean();

      if (!user) throw new Error(`User is not found.`);
      if (
        req.body.user.configs.timeZone != user.configs.timeZone &&
        user.standups.length != 0
      ) {
        user.configs.timeZone = req.body.user.configs.timeZone;
        StandUpHelpers.updateStandUpRemindersByUser(
          user,
          user.standups,
          true,
          true,
          true
        );
      }

      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: { configs: req.body.user.configs },
        },
        { new: true }
      );
      return res.json({ sucess: true, user: user })
    } catch (e) {
      return res
        .status(404)
        .json({ message: "Error updating user", error: e.message });
    }
  },

  deleteUser: async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        var user = await User.findOne({
          username: req.user.username,
        })
          .select("standups configs.timeZone")
          .lean();
  
      if (user.standups.length != 0)
        await StandUpHelpers.updateStandUpRemindersByUser(
          user,
          user.standups,
          true
        );

      user = await User.findByIdAndDelete(user._id);
      return res.json({ success: true, user: user })
    } catch (e) {
      return res
        .status(404)
        .json({ message: "Error deleting user", error: e.message });
    }
  },

  subscribeToStandUp: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  },
}
