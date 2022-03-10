import StandUp from '../Models/StandUp.js'
import StandUpUpdate from '../Models/StandUpUpdate.js'
import StandUpReminder from '../Models/StandUpReminder.js';
import User from '../Models/User.js'

import { validationResult } from 'express-validator';
import { DateTime } from "luxon";

class StandUpController {
    
    createNewStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

				if (req.body.reminders.length > 3)
					return res
            .status(400)
            .json({
              message: "Only up to a maximum of 3 reminders can be scheduled for a standup.",
            });

        StandUp.create(req.body.standup)
          .then((standup) => {
            if (req.body.reminders) {
              Promise.all(
                req.body.reminders.map(async (reminder) => {
                  let result = await this.createStandupReminders(
										standup,
                    DateTime.utc().day,
										reminder,
                  );

                  const reminder_format = {
                    reminder_id: result._id,
                    schedule: { hour: reminder.hour, min: reminder.min },
                  };

                  return StandUp.findByIdAndUpdate(
                    { _id: standup._id },
                    { $push: { reminders: reminder_format } }
                  ).exec();
                })
              );
            }
            res.json({ standup });
          })
          .catch((e) => {
            res.json({
              standup: {
                message: "There was an error creating new StandUp", error: e
							}
            });
          });
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
          if (standUp == null)
            throw new Error(
              `StandUp of id '${req.query.standupId}' is not found!`
            );

          if (standUp.reminders != null)
            await StandUpReminder.deleteMany({ standup_id: standUp._id });

          await User.updateMany(
            {},
            { $pull: { standups: req.query.standupId } }
          );
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
          if (standUp == null)
            throw new Error(`StandUp of id: ${req.query.standupId} not found!`);
        } catch (e) {
          return res
            .status(404)
            .json({ message: "StandUp not found!", errors: e.message });
        }

        function remindersListDiff(orginal, user_defined) {
          return user_defined.filter((obj1) => {
              return !orginal.some((obj2) => {
                // staticTime & reminder
                if (Object.keys(obj2).length > 2) {
                  return obj1 === String(obj2["_id"]);
                }
                // reminder
                return String(obj1.reminder_id) === String(obj2.reminder_id);
              });
            });
        }

        if (req.body.reminders && standUp.reminders.length != 0) {
          try {
            let reminderUpdates = req.body.reminders.map((reminder) => {
              return reminder.reminder_id;
            });
            var standUpReminders = await StandUpReminder.find({
              standup_id: standUp._id,
            }).lean();
  
            let undefinedReminders = remindersListDiff(
              standUpReminders,
              reminderUpdates
            );
  
            if (undefinedReminders.length != 0) {
              throw new Error(
                `Error in updating reminders. Reminders for id(s) ${undefinedReminders} cannot be found.`
              );
            }
          } catch (e) {
            return res.status(404).json({
              message: e.message,
            });
          }
        }

        try {
            const standup_body = req.body.standup;
						const standup_reminder = req.body.reminders;

            try {
                if (
                  standUp.reminders.length != 0 &&
                  standup_body.staticTime != standUp.staticTime
                ) {
                  await StandUpReminder.deleteMany({
                    standup_id: standUp._id,
                  });

                  if (standup_reminder) {
                    standUp.reminders = standup_reminder.concat(
                      remindersListDiff(standup_reminder, standUp.reminders)
                    );
                  }

									standUp.staticTime = standup_body.staticTime
                  const curDate = DateTime.utc().day;
                  const reminders = standUp.reminders.map(async (reminder) => {
                    let users = await User.find({ standups: String(standUp._id) });
                    let result = await this.createStandupReminders(
                      standUp,
                      curDate,
                      reminder.schedule
                    );

                    this.updateStandupReminders(
                      result._id,
                      reminder.schedule,
                      standup_body.staticTime,
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
                  standup_body["reminders"] = await Promise.all(
                    reminders
                  ).catch((e) => {
                    return res.status(404).json({
                      message: "There is an error enabling staticTime",
                      errors: e.message,
                    });
                  });
                } else if (standUp.reminders.length != 0 && standup_reminder) {
                  // update specific existing reminders
                  const reminders = standup_reminder.map(async (reminder) => {
                    let reminderObj = standUpReminders.filter(
                      (standup_reminder) => {
                        return standup_reminder._id == reminder.reminder_id;
                      }
                    );

                    await this.updateStandupReminders(
                      reminder.reminder_id,
                      reminder.schedule,
                      standUp.staticTime,
                      reminderObj[0].reminder_list
                    );

                    return reminder;
                  });

                  const resolved = await Promise.all(reminders);
                  standup_body["reminders"] = resolved.concat(
                    remindersListDiff(resolved, standUp.reminders)
                  );
                } else if (standUp.reminders.length == 0 && standup_reminder) {
                  // user did not set reminder initially
                  const reminders = standup_reminder.map(async reminder => {
                    standUp.staticTime = standup_body.staticTime;
                    let result = await this.createStandupReminders(
                      standUp,
                      DateTime.utc().day,
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
                      schedule: { hour: reminder.hour, min: reminder.min },
                    };

                    return reminder_format;
                  });
                  standup_body["reminders"] = await Promise.all(reminders);
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

          if (standUp.reminders) {
						await Promise.all(
              standUp.reminders.map(async (reminder) => {
                this.updateStandupReminders(
                  reminder.reminder_id,
                  reminder.schedule,
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
            user.standups = user.standups.slice(0,scrumIndex).concat(user.standups.slice(scrumIndex+1))
            user = await User.findOneAndUpdate({ username: user.username }, {$set:{standups : user.standups}}, {new: true});
            if (standUp.reminders) {
                if(standUp.staticTime)
                    await StandUpReminder.updateMany({ standup_id: standUp._id}, { $pull: { reminder_list: { user_id: user._id } } })
                 else
                    await StandUpReminder.updateMany({ standup_id: standUp._id}, { $pull: { 'reminder_list.$[].user_id': user._id } })
            }
        } catch (e) {
            return res.status(404).json({ message: "Error subscribing user to standup!", errors: e.message });
        }

        return res.json({ 'success': true, user: user });

    }

    async createStandupReminders (standup, date, schedule) {
      try {
				const reminderConfig = { standup_id: standup._id };

				if (standup.staticTime == false) {
					const notification_time = DateTime.fromObject(
						{ day: date, hour: schedule.hour, minute: schedule.min },
						{ zone: "utc" }
					);
					reminderConfig["reminder_list"] = [
						{ user_id: [], notification_time: notification_time },
					];
				}

				let result = await StandUpReminder.create(reminderConfig);
				return result;
      } catch (e) {
					return new Error({
						message: "Error creating standup reminders!",
						errors: e.message,
        	});
      	}
		}

		async updateStandupReminders (reminder_id, schedule, staticTime, users, generate = false) {
			if (generate == true) {
				if (staticTime == true) {
					const list_of_reminders = users.map((user) => {
						return {
							user_id: user._id,
							notification_time: this.genDate(
								DateTime.utc(),
								schedule,
								user.timeZone
							).plus({ days: 1 }),
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
					let standupreminder = await StandUpReminder.findById(reminder_id);
					let notification_time = DateTime.fromJSDate(
            standupreminder.reminder_list[0].notification_time,
            { zone: "utc" }
          ).plus({ days: 1 });
					let result = await StandUpReminder.findByIdAndUpdate(
						{ _id: reminder_id },
						{ 
							$push: { "reminder_list.$[].user_id": { $each: userIds } },
							$set: { "reminder_list.$[].notification_time": notification_time }
					 	},
						{ new: true }
					);
					return result;
				}
			} else {
				// update in existing reminders
				const new_reminders = users.map(async notification => {
					if (staticTime) {
						const user = await User.findById(notification.user_id)
							.select("timeZone")
							.lean();

						notification["notification_time"] = this.genDate(
							notification["notification_time"], schedule,
							user.timeZone, true
						);
						return notification;
					} else {
						notification["notification_time"] = this.genDate(
							notification["notification_time"], schedule,
							"utc", true
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
					{ $pull: { reminders: { reminder_id: standup_reminder._id } } },
					{new: true}
				);
				res.json({ standupreminder: standup_reminder });
			} catch (e) {
				return res
					.status(404)
					.json({
						message: `Error delete standup reminder of id ${req.query.reminderId}`,
						errors: e.message,
					});
			}
		}

		genDate (date, schedule, timeZone, exist = false) {
			if (exist) {
			return DateTime.fromJSDate(date, {
				zone: timeZone,
			})
				.set({
				hour: schedule.hour,
				minute: schedule.min,
				})
				.toUTC();
			} else {
			return DateTime.fromObject(
				{
				day: date.day,
				hour: schedule.hour,
				minute: schedule.min,
				},
				{ zone: timeZone }
			).toUTC();
			}
		}

}

export default new StandUpController();
