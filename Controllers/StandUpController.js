import StandUp from '../Models/StandUp.js'
import StandUpUpdate from '../Models/StandUpUpdate.js'
import StandUpReminder from '../Models/StandUpReminder.js';
import User from '../Models/User.js'

import { validationResult } from 'express-validator';
import { DateTime } from "luxon";

class StandUpController {
    
    async createNewStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        
        try {
          if (req.body.reminders) {
            if (req.body.reminders.length > 3) {
              throw new Error("Only up to a maximum of 3 reminders can be scheduled for a standup.")
            }
          }
          
          let standup_body = req.body.standup;
          if (standup_body.reminder_days) {
            req.body.standup.reminders = {};
            req.body.standup.reminders.reminder_days = standup_body.reminder_days;
            delete standup_body.reminder_days;
          }
          
          const standup = await StandUp.create(standup_body);
          if (req.body.reminders) {
            standup.reminders.reminder_list = await Promise.all(
              req.body.reminders.map(async (reminder) => {
                let result = await this.createStandupReminders(
                  standup,
                  reminder
                );
                
                const reminder_format = {
                  reminder_id: result._id,
                  schedule: {
                    hour: reminder.schedule.hour,
                    min: reminder.schedule.min,
                  },
                };
                
                await StandUp.findByIdAndUpdate(
                  { _id: standup._id },
                  { $push: { "reminders.reminder_list": reminder_format } }
                ).exec();
                
                return reminder_format;
              })
            );
          }
          res.json({ standup });
        } catch (e) {
          res.json({
            standup: {
              message: "There was an error creating new StandUp",
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
          }).exec();
          if (!standUp)
            throw new Error(
              `StandUp of id '${req.query.standupId}' is not found!`
            );
            
          if (standUp.reminders != null) {
            await StandUpReminder.deleteMany({ standup_id: standUp._id });
          }
          await User.updateMany({}, { $pull: { standups: req.query.standupId } });
          
          res.json({ success: true, standUp });
        } catch (e) {
          return res
            .status(404)
            .json({ message: "StandUp not found!", errors: e.message });
        }
    }

    async standUpList (req, res) {
        let standUps = await StandUp.find();
        res.json({ standups: standUps });
    }

    async standUpResponses (req, res) {
        let responses = null;
        if (req.query.standupId) {
          responses = await StandUpUpdate.find({standup_id: req.query.standupId});
          res.json({ standUpResponses: responses });
        }

        responses = await StandUpUpdate.find();
        res.json({ standUpResponses: responses });
    }

    async updateStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
          var standUp = await StandUp.findById(req.query.standupId);
          if (!standUp)
            throw new Error(`StandUp of id '${req.query.standupId}' not found!`);
        } catch (e) {
          return res
            .status(404)
            .json({ message: "StandUp not found!", errors: e.message });
        }
        
        let standup_body = req.body.standup;
        let standUp_reminders = standUp.reminders.reminder_list;
        
        standup_body.reminders = standUp.reminders
        if (standup_body.reminder_days) {
          standup_body.reminders.reminder_days = standup_body.reminder_days;
          delete standup_body.reminder_days;
        }
        
        try {
          var new_reminders = [];
          var update_reminders = [];
          // checks of reminder(s) option
          if (req.body.reminders) {
            req.body.reminders.forEach((reminder) => {
              if (String(Object.keys(reminder)) === String(["schedule"])) {
                new_reminders.push(reminder);
                let total = new_reminders.length + standUp_reminders.length;
                if (total > 3) {
                  throw new Error(
                    `There is currently ${standUp_reminders.length} existing reminders and only up to 3 can be scheduled in a standup!`
                  );
                }
              } else if (
                String(Object.keys(reminder)) == String(["reminder_id", "schedule"])) {
                  update_reminders.push(reminder);
                } else {
                  throw new Error(`${Object.keys(reminder)} is not valid!`);
                }
            });
            if (update_reminders.length != 0) {
              try {
                let reminderUpdates = update_reminders.map((reminder) => {
                  return reminder.reminder_id;
                });
                var standUpReminders = await StandUpReminder.find({
                  standup_id: standUp._id,
                }).lean();
                
                let undefinedReminders = this.remindersListDiff(
                  standUpReminders,
                  reminderUpdates
                );
                
                if (undefinedReminders.length != 0) {
                  throw new Error(
                    `Error in updating reminders. Reminders for id(s) '${undefinedReminders}' cannot be found.`
                  );
                }
              } catch (e) {
                return res.status(404).json({
                  message: "Error specifing update or create standup reminders.",
                  errors: e.message,
                });
              }
            }
          }
          
          // update/create reminder(s)
          try {
            if (standup_body.staticTime != standUp.staticTime) {
              standUp.staticTime = standup_body.staticTime
              await StandUpReminder.deleteMany({
                standup_id: standUp._id,
              });
              
              if (update_reminders.length != 0) {
                standUp_reminders = update_reminders.concat(
                  this.remindersListDiff(update_reminders, standUp_reminders)
                );
              }
              if (new_reminders.length != 0) {
                standUp_reminders = standUp_reminders.concat(new_reminders);
              }
              
              const reminders = standUp_reminders.map(async reminder => {
                let users = await User.find({ standups: String(standUp._id) });
                let result = await this.createStandupReminders(
                  standUp,
                  reminder
                );
                
                this.updateStandupReminders(
                  result._id,
                  reminder,
                  standUp.staticTime,
                  users,
                  true
                );
                
                const reminder_format = {
                  reminder_id: result._id,
                  schedule: {
                    hour: reminder.schedule.hour,
                    min: reminder.schedule.min,
                  },
                };
                
                return reminder_format;
              });
              
              standup_body.reminders.reminder_list = await Promise.all(reminders).catch((e) => {
                return res.status(404).json({
                  message: "There is an error enabling staticTime!",
                  errors: e.message,
                });
              });
            } else {
              if (update_reminders.length != 0) {
                const reminders = update_reminders.map(async (reminder) => {
                  let checkSame = standUp_reminders.some((exist_reminder) => {
                    if (
                      exist_reminder.schedule.hour ===
                        reminder.schedule.hour &&
                      exist_reminder.schedule.min == reminder.schedule.min
                    ) {
                      return true;
                    }
                  });
                  
                  // skip update for exact same
                  if (checkSame) {
                    return reminder;
                  } else {
                    let reminderObj = standUpReminders.filter(
                      (existing_reminder) => {
                        return existing_reminder._id == reminder.reminder_id;
                      }
                    );
                    
                    await this.updateStandupReminders(
                      reminder.reminder_id,
                      reminder,
                      standUp.staticTime,
                      reminderObj[0].reminder_list
                    );
                    
                    return reminder;
                  }
                });
                
                const resolved = await Promise.all(reminders);
                standup_body.reminders.reminder_list = resolved.concat(
                  this.remindersListDiff(resolved, standUp_reminders)
                );
              }
              if (new_reminders.length != 0) {
                const reminders = new_reminders.map(async reminder => {
                  let result = await this.createStandupReminders(
                    standUp,
                    reminder
                  );
                  let users = await User.find({ standups: String(standUp._id) });
                  
                  if (users.length > 0) {
                    this.updateStandupReminders(
                      result._id,
                      reminder,
                      standUp.staticTime,
                      users,
                      true
                    );
                  }
                  
                  const reminder_format = {
                    reminder_id: result._id,
                    schedule: {
                      hour: reminder.schedule.hour,
                      min: reminder.schedule.min,
                    },
                  };
                  
                  return reminder_format;
                });
                
                standup_body.reminders.reminder_list = standup_body.reminders.reminder_list.concat(
                  await Promise.all(reminders)
                );
              }
            }
          } catch (e) {
            return res.status(404).json({ message: "Error updating reminders for standup!", errors: e.message }); 
          }
          
          standUp = await StandUp.findOneAndUpdate({ _id: standUp._id }, standup_body, {new: true, runValidators: true});
        } catch (e) {
          return res.status(404).json({ message: "Error updating standup!", errors: e.message });
        }
        res.json({ 'standup': standUp });
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
            var standUp = await StandUp.findOne({ _id: req.body.standup_id });
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }

        if (user.standups.length > 0) {
            if (user.standups.indexOf(standUp.id) > -1) {
                return res.status(409).json({ 'success': false, message: "User already subscribed", user: user });
            }
        }

        try {
          user.standups.push(standUp.id);
          user = await User.findOneAndUpdate(
            { username: user.username },
            { $set: { standups: user.standups } },
            { new: true }
          );

          if (standUp.reminders.reminder_list) {
            await Promise.all(
              standUp.reminders.reminder_list.map(async (reminder) => {
                this.updateStandupReminders(
                  reminder.reminder_id,
                  reminder,
                  standUp.staticTime,
                  [user],
                  true
                );
              })
            );
          }
        } catch (e) {
          return res.status(404).json({
            message: "Error subscribing user to standup!",
            errors: e.message,
          });
        }

        return res.json({ 'success': true, user: user });

    }

    async unsubscribeToStandUp (req, res) {

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup_id });
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }


        if (user.standups.length > 0) {
            var scrumIndex = user.standups.indexOf(standUp.id);
            if (scrumIndex === -1) {
                return res.status(409).json({ 'success': false, message: "User not subscribed to scrum", user: user });
            } 
        }

        try {
            user.standups = user.standups
              .slice(0, scrumIndex)
              .concat(user.standups.slice(scrumIndex + 1));
            user = await User.findOneAndUpdate(
              { username: user.username },
              { $set: { standups: user.standups } },
              { new: true }
            );
            if (standUp.reminders) {
                if (standUp.staticTime)
                  await StandUpReminder.updateMany(
                    { standup_id: standUp._id },
                    { $pull: { reminder_list: { user_id: user._id } } }
                  );
                else
                  await StandUpReminder.updateMany(
                    { standup_id: standUp._id },
                    { $pull: { "reminder_list.$[].user_id": user._id } }
                  );
            }
        } catch (e) {
            return res
              .status(404)
              .json({
                message: "Error subscribing user to standup!",
                errors: e.message,
              });
        }

        return res.json({ 'success': true, user: user });

    }

    async createStandupReminders (standup, reminder) {
      try {
        const reminderConfig = { standup_id: standup._id };
        
        if (standup.staticTime == false) {
          reminderConfig["reminder_list"] = [{
            user_id: [],
            notification_time: this.genDate(reminder.schedule, "utc"),
          }];
        }
        
        return await StandUpReminder.create(reminderConfig);
      } catch (e) {
        return new Error({
          message: "Error creating standup reminders!",
          errors: e.message,
        });
      }
    }
    
    async updateStandupReminders (reminder_id, reminder, staticTime, users, generate = false) {
      if (generate) {
        if (staticTime) {
          const list_of_reminders = users.map((user) => {
            return {
              user_id: user._id,
              notification_time: this.genDate(reminder.schedule, user.timeZone),
            };
          });
          
          let result = await StandUpReminder.findByIdAndUpdate(
            { _id: reminder_id },
            { $push: { reminder_list: { $each: list_of_reminders } } },
            { new: true }
          );
          
          return result;
        } else {
          let userIds = users.map((user) => { return user._id; });
          let notification_time = this.genDate(reminder.schedule, 'utc');
          
          let result = await StandUpReminder.findByIdAndUpdate(
            { _id: reminder_id },
            {
              $set: { "reminder_list.$[].notification_time": notification_time },
              $push: { "reminder_list.$[].user_id": { $each: userIds } }
            },
            { new: true }
          );
          return result;
        }
      } else {
        // update in existing reminders
        const new_reminders = users.map(async (notification) => {
          if (staticTime) {
            const user = await User.findById(notification.user_id).select("timeZone").lean();
            
            notification["notification_time"] = this.genDate(
              reminder.schedule,
              user.timeZone
            );
            
            return notification;
          } else {
            notification["notification_time"] = this.genDate(
              reminder.schedule,
              "utc"
            );
            
            return notification;
          }
        });
        
        let reminder_list = await Promise.all(new_reminders);
        
        let result = StandUpReminder.findByIdAndUpdate(
          { _id: reminder_id },
          { $set: { reminder_list: reminder_list } },
          { new: true }
        ).exec();
        
        return result;
      }
    }
    
    async listStandupReminders (req, res) {
      try {
        let standup_reminder = await StandUpReminder.find();
        res.json({ 'standupreminders': standup_reminder });
      } catch (e) {
        return res.status(404).json({ message: "Error listing standup reminders!", errors: e.message });
      }
    }
    
    async deleteStandupReminder (req, res) {
      try {
        let standup_reminder = await StandUpReminder.findByIdAndDelete({
          _id: req.query.reminderId,
        });
        await StandUp.findByIdAndUpdate(
          { _id: standup_reminder.standup_id },
          { $pull: { "reminders.reminder_list": { reminder_id: standup_reminder._id } } },
          {new: true}
        );
        res.json({ standupreminder: standup_reminder });
      } catch (e) {
        let message = `Error delete standup reminder of id ${req.query.reminderId}`;
        return res.status(404).json({message: message, errors: e.message});
      }
    }
    
    genDate (schedule, timeZone) {
      return DateTime.fromObject({
        hour: schedule.hour,
        minute: schedule.min,
      },
      { zone: timeZone }).toUTC().plus({ days: 1 });
    }
    
    remindersListDiff (orginal, user_defined) {
      return user_defined.filter((obj1) => {
        return !orginal.some((obj2) => {
          // check update reminder exists
          if (Object.keys(obj2).length > 2) {
            return obj1 === String(obj2["_id"]);
          }
          // reminder
          return String(obj1.reminder_id) === String(obj2.reminder_id);
        });
      });
    }

}

export default new StandUpController();
