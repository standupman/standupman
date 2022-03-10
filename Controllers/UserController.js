import User from '../Models/User.js'
import UserConfig from '../Models/UserConfig.js';

import { validationResult } from 'express-validator';

export default {
  users: (req, res) => {
    User.find().then((users) => {
      res.json({ users: users });
    });
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

    try {
      UserConfig.findOne({ user_id: req.query.userId }).then(userconfig => {
        res.json({ userconfig })
      });
    } catch (e) {
      res.json({ userconfig: { message: "User configuration not found!", errors: e.message } });
    }
  }
};
