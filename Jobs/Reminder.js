import User from "../Models/User.js";
import StandUp from "../Models/StandUp.js";
import StandUpReminder from "../Models/StandUpReminder.js";
import UserConfig from "../Models/UserConfig.js";
import { boltApp } from "../mode/slack/app.js";

import { CronJob } from "cron";
import { DateTime } from "luxon";

const Reminders = {
  publishSlackMessage: async function (email, standup_name) {
    try {
      const slackUser = await boltApp.client.users.lookupByEmail({
        email: email,
      });
      const openChannel = await boltApp.client.conversations.open({
        users: slackUser.user.id,
      });

      boltApp.client.chat.postMessage({
        channel: openChannel.channel.id,
        text: `Hey <@${slackUser.user.name}> :wave:\nDo remember to submit your standup for ${standup_name} through invoking \`/standup-notes post\``,
      });
    } catch (error) {
      console.error(error);
    }
  },

  sendReminders: async function (user_id, standup_id) {
    const user = await User.findById(user_id).lean();
    const userMode = await UserConfig.findOne({ user_id: user._id })
      .select("medium_mode")
      .lean();
    const standup = await StandUp.findById({ _id: standup_id })
      .select("name")
      .lean();
    if (userMode.medium_mode == "slack") {
      this.publishSlackMessage(user.email, standup.name);
    }
  },

  processReminders: async function(reminders, date) {
    for (const reminder of reminders) {
      let standup_days = await StandUp.findById(reminder.standup_id)
        .select("reminders.reminder_days")
        .lean();
      let standup_reminders = reminder.reminder_list.map(
        async (user_reminder) => {
          // check if today's a day to send
          if (standup_days.reminders.reminder_days.includes(date.weekday)) {
            // no staticTime
            if (Array.isArray(user_reminder.user_id)) {
              try {
                await user_reminder.user_id.map((user_id) => {
                  this.sendReminders(user_id, reminder.standup_id);
                });
              } catch (e) {
                console.error("Error while sending reminders: ", e.message);
              } finally {
                let nextReminder = this.nextReminder(
                  user_reminder.notification_time,
                  "utc"
                );

                return StandUpReminder.findByIdAndUpdate(
                  { _id: reminder._id },
                  { "reminder_list.$[].notification_time": nextReminder }
                ).exec();
              }
            }
            // with staticTime
            if (user_reminder.notification_time < date) {
              try {
                await this.sendReminders(
                  user_reminder.user_id,
                  reminder.standup_id
                );
              } catch (e) {
                console.error("Error while sending reminders: ", e.message);
              } finally {
                let nextReminder = this.nextReminder(
                  user_reminder.notification_time,
                  "utc"
                );

                return StandUpReminder.findByIdAndUpdate(
                  { _id: reminder._id },
                  { $set: { "reminder_list.$[elem].notification_time": nextReminder } },
                  { arrayFilters: [{ "elem.user_id": { $eq: user_reminder.user_id } }] }
                ).exec();
              }
            }
          }
        }
      );

      await Promise.all(standup_reminders)
        .then(console.log("Reminders are successfully sent/update"))
        .catch((error) => {
          console.error(
            "Error resolving promises for reminders: ",
            error.message
          );
        });
    }
  },

  nextReminder: function (date, zone) {
    return DateTime.fromJSDate(date, { zone: zone }).plus({ days: 1 });
  }
};

export const remindersJob = new CronJob("*/3 * * * *", async () => {
    const date = DateTime.utc();
    const reminders = await StandUpReminder.find({
      "reminder_list.notification_time": { $lt: date },
    }).lean();

    console.log("Number of reminders to send: ", reminders.length);

    if (reminders.length != 0) {
      Reminders.processReminders(reminders, date);
    }
  }, null, true, "UTC"
);
