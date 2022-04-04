/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
import { validationResult } from 'express-validator';
import { DateTime } from 'luxon';

import User from '../Models/User';
import StandUp from '../Models/StandUp';
import StandUpUpdate from '../Models/StandUpUpdate';
import StandUpHelpers from '../utils/StandUpHelpers';

class StandUpController {
  async createNewStandUp(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const standupBody = req.body.standup;
    try {
      if (standupBody.reminders) {
        if (standupBody.reminders.schedules) {
          if (standupBody.reminders.schedules.length > 3) {
            throw new Error(
              'Only up to a maximum of 3 reminders can be scheduled for a standup.',
            );
          }

          const schedules = standupBody.reminders.schedules.map((schedule) => {
            if (standupBody.reminders.staticTime) {
              return this.createStandupReminders(schedule, true);
            }
            return this.createStandupReminders(schedule, false);
          });
          standupBody.reminders.schedules = schedules;
        }
      }

      const standUp = await StandUp.create(standupBody);
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
      let standUp = await StandUp.findById(req.params.id);
      if (!standUp) {
        throw new Error(`StandUp of id '${req.params.id}' not found!`);
      }

      const standupBody = req.body.standup;

      if (standupBody.reminders) {
        let standUpSchedules = standUp.reminders.schedules;
        const newSchedules = [];
        const updateSchedules = [];

        if (!standupBody.reminders.days) {
          standupBody.reminders.days = standUp.reminders.days;
        }

        // checks of schedule(s) option
        if (standupBody.reminders.schedules) {
          standupBody.reminders.schedules.forEach((schedule) => {
            if (String(Object.keys(schedule)) === String(['time'])) {
              newSchedules.push(schedule);
              if (newSchedules.length + standUpSchedules.length > 3) {
                throw new Error(
                  `There is currently ${standUpSchedules.length} existing reminders and only up to 3 can be scheduled in a standup!`,
                );
              }
            } else if (
              String(Object.keys(schedule)) === String(['_id', 'time'])
            ) {
              updateSchedules.push(schedule);
            } else {
              throw new Error(`${Object.keys(schedule)} is not valid!`);
            }
          });

          if (updateSchedules.length !== 0) {
            const scheduleIds = updateSchedules.map((schedule) => schedule._id);
            const undefinedSchedules = StandUpHelpers.remindersArrDiff(
              standUpSchedules,
              scheduleIds,
            );

            if (undefinedSchedules.length !== 0) {
              throw new Error(
                `Error in updating reminders. Reminder schedules for id(s) '${undefinedSchedules}' cannot be found.`,
              );
            }
          }
        } else {
          standupBody.reminders.schedules = standUpSchedules;
        }

        // update/create reminder(s)
        if (
          standupBody.reminders.staticTime !== undefined
          && standupBody.reminders.staticTime !== standUp.reminders.staticTime
        ) {
          if (updateSchedules.length !== 0) {
            standUpSchedules = updateSchedules.concat(
              StandUpHelpers.remindersArrDiff(
                updateSchedules,
                standUpSchedules,
              ),
            );
          }
          if (newSchedules.length !== 0) {
            standUpSchedules = standUpSchedules.concat(newSchedules);
          }

          const schedules = standUpSchedules.map(async (schedule) => {
            const result = this.createStandupReminders(
              schedule,
              standupBody.reminders.staticTime,
            );
            const users = await User.find({ standups: standUp._id })
              .select('configs.timeZone')
              .lean();

            if (users.length > 0) {
              return this.updateStandupReminders(
                result,
                users,
                standupBody.reminders.staticTime,
              );
            }
            return result;
          });
          standupBody.reminders.schedules = await Promise.all(schedules).catch(
            (e) => res.status(404).json({
              message: 'There is an error enabling staticTime!',
              errors: e.message,
            }),
          );
        } else {
          const users = await User.find({ standups: standUp._id })
            .select('configs.timeZone')
            .lean();
          standupBody.reminders.schedules = standUpSchedules;
          standupBody.reminders.staticTime = standUp.reminders.staticTime;

          if (updateSchedules.length !== 0) {
            // eslint-disable-next-line no-restricted-syntax
            for (const schedule of updateSchedules) {
              const same = standUpSchedules.some((existSchedules) => {
                if (
                  existSchedules.time.hour === schedule.time.hour
                  && existSchedules.time.min === schedule.time.min
                ) {
                  return true;
                }
                return false;
              });

              // skip update if same
              if (!same) {
                const scheduleIdx = standUpSchedules.findIndex(
                  (obj) => String(obj._id) === schedule._id,
                );

                standUpSchedules[scheduleIdx].time = schedule.time;
                standUpSchedules[scheduleIdx] = this.updateStandupReminders(
                  standUpSchedules[scheduleIdx],
                  users,
                  standUp.reminders.staticTime,
                );
              }
            }
            standupBody.reminders.schedules = standUpSchedules;
          }
          if (newSchedules.length !== 0) {
            const schedules = newSchedules.map(async (schedule) => {
              const result = this.createStandupReminders(
                schedule,
                standUp.reminders.staticTime,
              );
              const users = await User.find({
                standups: standUp._id,
              })
                .select('configs.timeZone')
                .lean();

              if (users.length > 0) {
                return this.updateStandupReminders(
                  result,
                  users,
                  standUp.reminders.staticTime,
                  true,
                );
              }
              return result;
            });
            standupBody.reminders.schedules = standupBody.reminders.schedules.concat(
              await Promise.all(schedules),
            );
          }
        }
      } else {
        standupBody.reminders = standUp.reminders;
      }

      standUp = await StandUp.findOneAndUpdate(
        { _id: standUp._id },
        standupBody,
        { new: true, runValidators: true },
      );
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
      if (standUp.reminders.schedules.length !== 0) {
        await StandUpHelpers.updateStandUpRemindersByUser(
          user,
          [standUp._id],
          true,
          true,
        );
      }

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
      await StandUpHelpers.updateStandUpRemindersByUser(
        user,
        [standUp._id],
        true,
      );
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

  createStandupReminders(schedule, staticTime) {
    const scheduleConfig = { time: schedule.time };

    if (staticTime === false) {
      scheduleConfig.list = [
        {
          user_id: [],
          notification_time: StandUpHelpers.genDate(schedule.time, 'utc'),
        },
      ];
    }

    return scheduleConfig;
  }

  updateStandupReminders(schedule, users, staticTime) {
    if (staticTime) {
      const listOfSchedules = users.map((user) => ({
        user_id: user._id,
        notification_time: StandUpHelpers.genDate(
          schedule.time,
          user.configs.timeZone,
        ),
      }));

      schedule.list = listOfSchedules;
      return schedule;
    }
    const userIds = users.map((user) => user._id);
    const notificationTime = StandUpHelpers.genDate(schedule.time, 'utc');

    schedule.list[0].user_id = userIds;
    schedule.list[0].notification_time = notificationTime;
    return schedule;
  }
}

export default new StandUpController();
