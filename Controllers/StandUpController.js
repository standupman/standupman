/* eslint-disable class-methods-use-this */
import { validationResult } from 'express-validator';
import StandUp from '../Models/StandUp';
import StandUpUpdate from '../Models/StandUpUpdate';
import User from '../Models/User';

class StandUpController {
  async createNewStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const standUp = await StandUp.create(req.body.standup);
      res.json({ standUp });
    } catch (error) {
      res.json({
        standup: {
          message: 'There was an error creating new StandUp',
          errorDetails: error,
        },
      });
    }
  }

  deleteStandUp(req, res) {
    res.json(req);
  }

  async standUpList(req, res) {
    const standUps = await StandUp.find();
    res.json({ standups: standUps });
  }

  async standUpResponses(req, res) {
    let responses = null;
    if (req.query.standup_id) {
      responses = await StandUpUpdate.find({
        standup_id: req.query.standup_id,
      });
      res.json({ standUpResponses: responses });
    }

    responses = await StandUpUpdate.find();
    res.json({ standUpResponses: responses });
  }

  async updateStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    let standUp = null;
    try {
      standUp = await StandUp.findOne({ _id: req.body.standup.id });
    } catch (e) {
      res
        .status(404)
        .json({ message: 'StandUp not found!', errors: e.message });
    }

    try {
      standUp = await StandUp.findOneAndUpdate(
        { _id: standUp.id },
        req.body.standup,
        { new: true, runValidators: true },
      );
      // StandUp.findOneAndUpdate()
    } catch (e) {
      res
        .status(404)
        .json({ message: 'Error updating standup!', errors: e.message });
    }

    res.json({ StandUp: standUp });
  }

  async completeStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    let standUpUpdate;

    try {
      standUpUpdate = await StandUpUpdate.create(req.body.standup_update);
      res.json({ standUpUpdate });
    } catch (e) {
      res.json({
        StandUp: {
          message: 'There was an error creating new StandUp',
          errorDetails: e,
        },
      });
    }
  }

  async subscribeToStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    let standUp = null;
    let user = null;

    try {
      standUp = await StandUp.findOne({ _id: req.body.standup_id });
    } catch (e) {
      res
        .status(404)
        .json({ message: 'StandUp not found!', errors: e.message });
    }

    try {
      user = await User.findOne({ username: req.user.username });
    } catch (e) {
      res
        .status(500)
        .json({ message: 'Error getting user', errors: e.message });
    }

    if (user.standups.length > 0) {
      if (user.standups.indexOf(standUp.id) > -1) {
        res
          .status(409)
          .json({ success: false, message: 'User already subscribed', user });
      }
    }

    try {
      user.standups.push(standUp.id);
      user = await User.findOneAndUpdate(
        { username: user.username },
        { $set: { standups: user.standups } },
        { new: true },
      );
    } catch (e) {
      res
        .status(404)
        .json({
          message: 'Error subscribing user to standup!',
          errors: e.message,
        });
    }

    res.json({ success: true, user });
  }

  async unsubscribeToStandUp(req, res) {
    let standUp = null;
    let user = null;
    let scrumIndex = null;
    try {
      standUp = await StandUp.findOne({ _id: req.body.standup_id });
    } catch (e) {
      res
        .status(404)
        .json({ message: 'StandUp not found!', errors: e.message });
    }

    try {
      user = await User.findOne({ username: req.user.username });
    } catch (e) {
      res
        .status(500)
        .json({ message: 'Error getting user', errors: e.message });
    }

    if (user.standups.length > 0) {
      scrumIndex = user.standups.indexOf(standUp.id);
      if (scrumIndex === -1) {
        res
          .status(409)
          .json({
            success: false,
            message: 'User not subscribed to scrum',
            user,
          });
      }
    }

    try {
      user.standups = user.standups
        .slice(0, scrumIndex)
        .concat(user.standups.slice(scrumIndex + 1));

      user = await User.findOneAndUpdate(
        { username: user.username },
        { $set: { standups: user.standups } },
        { new: true },
      );
    } catch (e) {
      res
        .status(404)
        .json({
          message: 'Error subscribing user to standup!',
          errors: e.message,
        });
    }

    res.json({ success: true, user });
  }
}

export default new StandUpController();
