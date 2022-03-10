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
};

export const remindersJob = new CronJob("*/1 * * * *", async () => {
    const curDate = DateTime.now().toUTC();
    const reminders = await StandUpReminder.find({
      "reminder_list.notification_time": { $lt: curDate },
    }).lean();

    console.log("Number of reminders to send: ", reminders.length)

    if (reminders.length != 0) {
      reminders.map(async (reminder) => {
        await Promise.all(
          reminder.reminder_list.map(async (user_reminder) => {
            // check reminder has been sent before  
            if (
              user_reminder.last_modified == null ||
              user_reminder.last_modified.getDate() != curDate.get("day")
            ) {
              // no staticTime
              if (Array.isArray(user_reminder.user_id)) {
                try {
                  await user_reminder.user_id.map((user_id) => {
                    Reminders.sendReminders(user_id, reminder.standup_id);
                  });
                } catch (e) {
                  console.error("Error while sending reminders: ", e.message);
                } finally {
                  let nextReminder = DateTime.fromJSDate(
                    user_reminder.notification_time,
                    { zone: "utc" }
                  ).plus({ days: 1 });

                  StandUpReminder.findByIdAndUpdate(
                    { _id: reminder._id },
                    { "reminder_list.$[].notification_time": nextReminder },
                    {
                      "reminder_list.$[].last_modified": DateTime.now().toUTC(),
                    }
                  ).exec();
                }
              }

              // with staticTime
              if (user_reminder.notification_time < curDate) {
                try {
                  await Reminders.sendReminders(
                    user_reminder.user_id,
                    reminder.standup_id
                  );
                } catch (e) {
                  console.error("Error while sending reminders: ", e.message);
                } finally {
                  var nextReminder = DateTime.fromJSDate(
                    user_reminder.notification_time,
                    { zone: "utc" }
                  ).plus({ days: 1 });

                  StandUpReminder.findByIdAndUpdate(
                    { _id: reminder._id },
                    {
                      $set: {
                        "reminder_list.$[elem].notification_time": nextReminder,
                        "reminder_list.$[elem].last_modified":
                          DateTime.now().toUTC(),
                      },
                    },
                    {
                      arrayFilters: [
                        { "elem.user_id": { $eq: user_reminder.user_id } },
                      ],
                    }
                  ).exec();
                }
              }
            }
          })
        )
          .then(console.log("Reminders are successfully sent"))
          .catch((error) => {
            console.error(
              "Error resolving promises for reminders: ",
              error.message
            );
          });
      });
    }
  }, null, true, "UTC"
);
