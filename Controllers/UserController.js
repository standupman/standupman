import User from '../Models/User.js'
import UserConfig from '../Models/UserConfig.js';

import { validationResult } from 'express-validator';
import StandUpReminder from '../Models/StandUpReminder.js';
import StandUp from '../Models/StandUp.js';

export default {
  users: (req, res) => {
    User.find().then((users) => {
      res.json({ users: users });
    });
  },

  deleteUser: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var user = await User.findByIdAndDelete(req.query.userId);
      if (user == null) {
        throw new Error(`User id '${req.query.userId}' is not found.`);
      }
      await UserConfig.deleteOne({ user_id: user._id });
      await Promise.all(
        user.standups.map(async (standupId) => {
          var standUp = await StandUp.findById(standupId).lean();
          if (standUp.reminders)
            if (standUp.staticTime)
              return StandUpReminder.updateMany(
                { standup_id: standupId },
                { $pull: { reminder_list: { user_id: user._id } } }
              ).exec();
            else
              return StandUpReminder.updateMany(
                { standup_id: standupId },
                { $pull: { "reminder_list.$[].user_id": user._id } }
              ).exec();
        })
      );
      return res.json({ 'success': true, user: user });
    } catch (e) {
      return res.status(404).json({ message: "Error deleting user!", errror: e.message });
    }
  },

  subscribeToStandUp: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  },

  setUserConfig: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var user = await User.findById({ _id: req.query.userId }).lean();
    } catch (e) {
      return res
        .status(404)
        .json({ message: "User not found!", errors: e.message });
    }

    try {
      var reqBody = req.body.userconfig;
      reqBody["user_id"] = user._id;
      UserConfig.findOneAndUpdate({ user_id: user._id }, reqBody, {new: true}).then(userconfig => {
        res.json({ userconfig })
      });
    } catch (e) {
      res.json({ userconfig: { message: "There was an error creating new user configurations", errors: e.message } });
    }
  },

  getUserConfig: (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    UserConfig.findOne({ user_id: req.query.userId }).then(userconfig => {
      if (!userconfig) {
        return res
          .status(404)
          .json({
            message: "User configuration not found!",
            errors: `User of id ${req.query.userId} does not exists.`,
          });
      } else {
        res.json({ userconfig });
      }
    });
  }
}
