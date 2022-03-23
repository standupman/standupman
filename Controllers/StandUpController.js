import StandUp from '../Models/StandUp.js'
import StandUpUpdate from '../Models/StandUpUpdate.js'
import User from '../Models/User.js'
import StandUpHelpers from '../utils/StandUpHelpers.js'

import { validationResult } from 'express-validator';
import { DateTime } from "luxon";

class StandUpController {
    
    async createNewStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        let standup_body = req.body.standup;
        try {
          if (standup_body.reminders) {
            if (standup_body.reminders.schedules) {
              if (standup_body.reminders.schedules.length > 3) {
                throw new Error("Only up to a maximum of 3 reminders can be scheduled for a standup.")
              }
              
              const schedules = standup_body.reminders.schedules.map(
                (schedule) => {
                  if (standup_body.reminders.staticTime)
                    return this.createStandupReminders(schedule, true);
                  return this.createStandupReminders(schedule, false);
                }
              );
              standup_body.reminders.schedules = schedules;
            }
          }
          
          const standUp = await StandUp.create(standup_body);
          res.json({ success: true, standup: standUp });
        } catch (e) {
          res.json({
            standup: {
              message: "Error creating new StandUp!",
              error: e.message,
            },
          });
        }
    }

    async deleteStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        try {
          let standUp = await StandUp.findOneAndDelete({
            _id: req.query.standupId,
          }).lean();
          if (!standUp)
            throw new Error(
              `StandUp of id '${req.query.standupId}' is not found!`
            );
            
          await User.updateMany({}, { $pull: { standups: standUp._id } });
          
          res.json({ success: true, standup: standUp });
        } catch (e) {
          return res
            .status(404)
            .json({ message: "Error deleting StandUp!", errors: e.message });
        }
    }

    async standUpList (req, res) {
        let standUps = await StandUp.find();
        res.json({ standups: standUps });
    }

    async standUpResponses (req, res) {
        let responses = null;
        if (req.query.standupId) {
          responses = await StandUpUpdate.findById(req.query.standupId);
          res.json({ sucess: true, standup_response: responses });
        }

        responses = await StandUpUpdate.find();
        res.json({ sucess: true, standup_response: responses });
    }

    async updateStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
          var standUp = await StandUp.findById(req.query.standupId);
          if (!standUp)
            throw new Error(
              `StandUp of id '${req.query.standupId}' not found!`
            );

          let standup_body = req.body.standup;

          if (standup_body.reminders) {
            let standUp_schedules = standUp.reminders.schedules;
            var new_schedules = [];
            var update_schedules = [];

            if (!standup_body.reminders.days)
              standup_body.reminders.days = standUp.reminders.days;

            // checks of schedule(s) option
            if (standup_body.reminders.schedules) {
              standup_body.reminders.schedules.forEach((schedule) => {
                if (String(Object.keys(schedule)) === String(["time"])) {
                  new_schedules.push(schedule);
                  if (new_schedules.length + standUp_schedules.length > 3) {
                    throw new Error(
                      `There is currently ${standUp_schedules.length} existing reminders and only up to 3 can be scheduled in a standup!`
                    );
                  }
                } else if (
                  String(Object.keys(schedule)) === String(["_id", "time"])
                ) {
                  update_schedules.push(schedule);
                } else {
                  throw new Error(`${Object.keys(schedule)} is not valid!`);
                }
              });

              if (update_schedules.length != 0) {
                let schedule_ids = update_schedules.map((schedule) => {
                  return schedule._id;
                });
                let undefinedSchedules = StandUpHelpers.remindersArrDiff(
                  standUp_schedules,
                  schedule_ids
                );

                if (undefinedSchedules.length != 0)
                  throw new Error(
                    `Error in updating reminders. Reminder schedules for id(s) '${undefinedSchedules}' cannot be found.`
                  );
              }
            } else {
              standup_body.reminders.schedules = standUp_schedules;
            }

            // update/create reminder(s)
            if (
              standup_body.reminders.staticTime !== undefined &&
              standup_body.reminders.staticTime !== standUp.reminders.staticTime
            ) {
              if (update_schedules.length != 0) {
                standUp_schedules = update_schedules.concat(
                  StandUpHelpers.remindersArrDiff(update_schedules, standUp_schedules)
                );
              }
              if (new_schedules.length != 0) {
                standUp_schedules = standUp_schedules.concat(new_schedules);
              }

              const schedules = standUp_schedules.map(async (schedule) => {
                let result = this.createStandupReminders(
                  schedule,
                  standup_body.reminders.staticTime
                );
                let users = await User.find({ standups: standUp._id })
                  .select("configs.timeZone")
                  .lean();

                if (users.length > 0) {
                  return this.updateStandupReminders(
                    result,
                    users,
                    standup_body.reminders.staticTime
                  );
                }
                return result;
              });
              standup_body.reminders.schedules = await Promise.all(
                schedules
              ).catch((e) => {
                return res.status(404).json({
                  message: "There is an error enabling staticTime!",
                  errors: e.message,
                });
              });
            } else {
              standup_body.reminders.schedules = standUp_schedules;
              standup_body.reminders.staticTime = standUp.reminders.staticTime;
              
              if (update_schedules.length != 0) {
                for (const schedule of update_schedules) {
                  let same = standUp_schedules.some((exists_schedule) => {
                    if (
                      exists_schedule.time.hour === schedule.time.hour &&
                      exists_schedule.time.min === schedule.time.min
                    ) {
                      return true;
                    }
                  });

                  // skip update if same
                  if (same) {
                    continue;
                  } else {
                    let users = await User.find({
                      standups: standUp._id,
                    })
                      .select("configs.timeZone")
                      .lean();
                    let scheduleIdx = standUp_schedules.findIndex(
                      (obj) => String(obj._id) === schedule._id
                    );

                    standUp_schedules[scheduleIdx].time = schedule.time;
                    standUp_schedules[scheduleIdx] =
                      this.updateStandupReminders(
                        standUp_schedules[scheduleIdx],
                        users,
                        standUp.reminders.staticTime
                      );
                  }
                }
                standup_body.reminders.schedules = standUp_schedules;
              }
              if (new_schedules.length != 0) {
                const schedules = new_schedules.map(async (schedule) => {
                  let result = this.createStandupReminders(
                    schedule,
                    standUp.reminders.staticTime
                  );
                  let users = await User.find({
                    standups: standUp._id,
                  })
                    .select("configs.timeZone")
                    .lean();

                  if (users.length > 0) {
                    return this.updateStandupReminders(
                      result,
                      users,
                      standUp.reminders.staticTime,
                      true
                    );
                  }
                  return result;
                });
                standup_body.reminders.schedules =
                  standup_body.reminders.schedules.concat(
                    await Promise.all(schedules)
                  );
              }
            }
          } else {
            standup_body.reminders = standUp.reminders;
          }

          standUp = await StandUp.findOneAndUpdate(
            { _id: standUp._id },
            standup_body,
            { new: true, runValidators: true }
          );
          res.json({ success: true, standup: standUp });
        } catch (e) {
          return res
            .status(404)
            .json({ message: "Error updating standup!", errors: e.message });
        }
    }

    async completeStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        req.body.standup_update.response = DateTime.utc()

        StandUpUpdate.create(req.body.standup_update).then((standUpUpdate) => {
            res.json({ 'standUpUpdate': standUpUpdate });
        }).catch((error) => {
            res.json({ StandUp: { message: "There was an error creating new StandUp", errorDetails: error } });
        });
    }

    async subscribeToStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup_id })
              .select("reminders")
              .lean();
            if (!standUp) throw new Error(`StandUp id '${req.body.standup_id}' not found.`);
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }

        if (user.standups.length > 0) {
          if (user.standups.indexOf(standUp._id) > -1) {
            return res.status(409).json({
              success: false,
              message: "User already subscribed",
              user: user,
            });
          }
        }

        try {
          if (standUp.reminders.schedules.length != 0) {
            await StandUpHelpers.updateStandUpRemindersByUser(
              user,
              [standUp._id],
              true,
              true
            );
          }

          user.standups.push(standUp._id);
          user = await User.findOneAndUpdate(
            { username: user.username },
            { $set: { standups: user.standups } },
            { new: true }
          ).lean();

          return res.json({ success: true, user: user });
        } catch (e) {
          return res.status(404).json({
            message: "Error subscribing user to standup!",
            errors: e.message,
          });
        }

    }

    async unsubscribeToStandUp (req, res) {

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup_id })
              .select("_id")
              .lean();
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }

        var scrumIndex = user.standups.indexOf(standUp._id);
        if (scrumIndex === -1) {
          return res.status(409).json({
            success: false,
            message: "User not subscribed to StandUp",
            user: user,
          });
        }

        try {
          await StandUpHelpers.updateStandUpRemindersByUser(
            user,
            [standUp._id],
            true
          );
          user.standups = user.standups
            .slice(0, scrumIndex)
            .concat(user.standups.slice(scrumIndex + 1));
          user = await User.findOneAndUpdate(
            { username: user.username },
            { $set: { standups: user.standups } },
            { new: true }
          ).lean();

          return res.json({ success: true, user: user });
        } catch (e) {
            return res.status(404).json({
              message: "Error unsubscribing user from standup!",
              errors: e.message,
            });
        }

    }

    createStandupReminders (schedule, staticTime) {
      let scheduleConfig = { time: schedule.time };
        
      if (staticTime == false) {
        scheduleConfig["list"] = [{
          user_id: [],
          notification_time: StandUpHelpers.genDate(schedule.time, "utc"),
        }];
      }

      return scheduleConfig
    }
    
    updateStandupReminders (schedule, users, staticTime) {
      if (staticTime) {
        const list_of_schedules = users.map((user) => {
          return {
            user_id: user._id,
            notification_time: StandUpHelpers.genDate(
              schedule.time,
              user.configs.timeZone
            ),
          };
        });

        schedule.list = list_of_schedules;
        return schedule;
      } else {
        let userIds = users.map((user) => {
          return user._id;
        });
        let notification_time = StandUpHelpers.genDate(schedule.time, "utc");

        schedule.list[0].user_id = userIds;
        schedule.list[0].notification_time = notification_time;
        return schedule;
      }
    }

}

export default new StandUpController();
