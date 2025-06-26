/* eslint-disable class-methods-use-this */
import { validationResult } from 'express-validator';
import StandUp from '../Models/StandUp.js';
import StandUpUpdate from '../Models/StandUpUpdate.js';
import User from '../Models/User.js';

class StandUpController {
  async createNewStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const standUp = await StandUp.create(req.body.standup);
      return res.status(201).json({ standUp });
    } catch (error) {
      return res.status(500).json({
        message: 'There was an error creating new StandUp',
        error: error.message,
      });
    }
  }

  // TODO: Implement delete functionality
  deleteStandUp(req, res) {
    res.status(501).json({ message: 'Not Implemented' });
  }

  async standUpList(req, res) {
    try {
      const standUps = await StandUp.find();
      return res.json({ standups: standUps });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching standups', error: error.message });
    }
  }

  async standUpResponses(req, res) {
    try {
      const query = req.query.standup_id ? { standup_id: req.query.standup_id } : {};
      const responses = await StandUpUpdate.find(query);
      return res.json({ standUpResponses: responses });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching standup responses', error: error.message });
    }
  }

  async updateStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const standUp = await StandUp.findByIdAndUpdate(
        req.params.id,
        req.body.standup,
        { new: true, runValidators: true },
      );

      if (!standUp) {
        return res.status(404).json({ message: 'StandUp not found!' });
      }

      return res.json({ StandUp: standUp });
    } catch (e) {
      return res.status(500).json({ message: 'Error updating standup!', error: e.message });
    }
  }

  async completeStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const standUpUpdate = await StandUpUpdate.create(req.body.standup_update);
      return res.status(201).json({ standUpUpdate });
    } catch (e) {
      return res.status(500).json({
        message: 'There was an error completing the StandUp',
        error: e.message,
      });
    }
  }

  async subscribeToStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const standUp = await StandUp.findById(req.body.standup_id);
      if (!standUp) {
        return res.status(404).json({ message: 'StandUp not found!' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found!' });
      }

      // Add member to standup if not already a member
      if (!standUp.members.includes(user.id)) {
        standUp.members.push(user.id);
        await standUp.save();
      }

      return res.json({ standUp });
    } catch (e) {
      return res.status(500).json({ message: 'Could not subscribe user to standup', error: e.message });
    }
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
