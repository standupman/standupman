/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
import { validationResult } from 'express-validator';
import { DateTime } from 'luxon';

import User from '../Models/User';
import StandUp from '../Models/StandUp';
import StandUpUpdate from '../Models/StandUpUpdate';
import StandUpHelpers from '../utils/helpers/StandUpHelpers';

class StandUpController {
  async createNewStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { body } = req;
    try {
      if (body.reminders) {
        const { reminders } = body;

        if (reminders.schedules && reminders.schedules.length > 0) {
          // eslint-disable-next-line arrow-body-style
          const schedules = reminders.schedules.map((schedule) => {
            return this.createStandupReminders(schedule, reminders.timeZone);
          });
          reminders.schedules = schedules;
        }
      }

      const standUp = await StandUp.create(body);
      return res.json({ success: true, standup: standUp });
    } catch (e) {
      return res.status(400).json({
        standup: {
          message: 'Error creating new StandUp!',
          error: e.message,
        },
      });
    }
  }

  async deleteStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let standUp = await StandUp.findOne({ _id: req.params.id })
        .select('_id')
        .lean();

      if (!standUp) {
        throw new Error(`StandUp of id '${req.params.id}' is not found!`);
      }

      await User.updateMany({}, { $pull: { standups: standUp._id } });

      standUp = await StandUp.findOneAndDelete({
        _id: req.params.id,
      }).lean();

      return res.json({ success: true, standup: standUp });
    } catch (e) {
      return res
        .status(404)
        .json({ message: 'Error deleting StandUp!', errors: e.message });
    }
  }

  async standUpList(req, res) {
    const standUps = await StandUp.find();
    return res.json({ standups: standUps });
  }

  async standUpResponses(req, res) {
    let responses = null;
    if (req.query.standupId) {
      responses = await StandUpUpdate.findById(req.query.standupId);
      return res.json({ sucess: true, standup_response: responses });
    }

    responses = await StandUpUpdate.find();
    return res.json({ sucess: true, standup_response: responses });
  }

  async updateStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let { standUp } = req;
      const { body } = req;

      if (body.reminders) {
        const standUpSchedules = standUp.reminders.schedules;

        // checks of schedule(s) option
        if (body.reminders.schedules && body.reminders.schedules.length !== 0) {
          const unifiedSchedules = body.reminders.schedules.reduce((acc, schedule) => {
            const existScheduleIdx = standUpSchedules.findIndex(
              (obj) => obj.time.hour === schedule.time.hour
                && obj.time.min === schedule.time.min,
            );

            // update/retain reminder(s)
            if (existScheduleIdx !== -1) {
              const existSchedule = standUpSchedules.splice(existScheduleIdx, 1)[0];
              const checkNotification = StandUpHelpers.genDate(
                schedule.time,
                body.reminders.timeZone,
              ).toISO();

              if (
                StandUpHelpers.checkTimeEqual(
                  existSchedule.notification_time.toISOString(),
                  checkNotification,
                )
              ) {
                acc.push(existSchedule);
                return acc;
              }

              existSchedule.notification_time = checkNotification;
              acc.push(existSchedule);
              return acc;
            }

            // create reminder(s)
            const result = this.createStandupReminders(
              schedule,
              body.reminders.timeZone,
            );

            acc.push(result);
            return acc;
          }, []);

          body.reminders.schedules = unifiedSchedules;
        }
      }

      standUp = await StandUp.findOneAndUpdate(
        { _id: standUp._id },
        body,
        { new: true, runValidators: true },
      ).lean();
      return res.json({ success: true, standup: standUp });
    } catch (e) {
      return res
        .status(404)
        .json({ message: 'Error updating standup!', errors: e.message });
    }
  }

  completeStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    req.body.standup_update.responseTime = DateTime.utc();

    return StandUpUpdate.create(req.body.standup_update)
      .then((standUpUpdate) => res.json({ standUpUpdate }))
      .catch((error) => res.json({
        StandUp: {
          message: 'There was an error creating new StandUp',
          errorDetails: error,
        },
      }));
  }

  async subscribeToStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var standUp = await StandUp.findOne({ _id: req.body.standup_id })
        .select('reminders')
        .lean();
      if (!standUp) {
        throw new Error(`StandUp id '${req.body.standup_id}' not found.`);
      }
    } catch (e) {
      return res
        .status(404)
        .json({ message: 'StandUp not found!', errors: e.message });
    }

    try {
      var user = await User.findOne({ username: req.user.username });
    } catch (e) {
      return res
        .status(500)
        .json({ message: 'Error getting user', errors: e.message });
    }

    if (user.standups.length > 0) {
      if (user.standups.indexOf(standUp._id) > -1) {
        return res.status(409).json({
          success: false,
          message: 'User already subscribed',
          user: user,
        });
      }
    }

    try {
      user.standups.push(standUp._id);
      user = await User.findOneAndUpdate(
        { username: user.username },
        { $set: { standups: user.standups } },
        { new: true },
      ).lean();

      return res.json({ success: true, user: user });
    } catch (e) {
      return res.status(404).json({
        message: 'Error subscribing user to standup!',
        errors: e.message,
      });
    }
  }

  async unsubscribeToStandUp(req, res) {
    try {
      var standUp = await StandUp.findOne({ _id: req.body.standup_id })
        .select("_id")
        .lean();
    } catch (e) {
      return res
        .status(404)
        .json({ message: 'StandUp not found!', errors: e.message });
    }

    try {
      var user = await User.findOne({ username: req.user.username });
    } catch (e) {
      return res
        .status(500)
        .json({ message: 'Error getting user', errors: e.message });
    }

    const scrumIndex = user.standups.indexOf(standUp._id);
    if (scrumIndex === -1) {
      return res.status(409).json({
        success: false,
        message: 'User not subscribed to StandUp',
        user: user,
      });
    }

    try {
      user.standups = user.standups
        .slice(0, scrumIndex)
        .concat(user.standups.slice(scrumIndex + 1));
      user = await User.findOneAndUpdate(
        { username: user.username },
        { $set: { standups: user.standups } },
        { new: true },
      ).lean();

      return res.json({ success: true, user });
    } catch (e) {
      return res.status(404).json({
        message: 'Error unsubscribing user from standup!',
        errors: e.message,
      });
    }
  }

  createStandupReminders(schedule, timeZone) {
    const scheduleConfig = {
      time: schedule.time,
      notification_time: StandUpHelpers.genDate(schedule.time, timeZone),
    };

    return scheduleConfig;
  }
}

export default new StandUpController();
