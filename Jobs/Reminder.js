import User from "../Models/User.js";
import StandUp from "../Models/StandUp.js";
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

  sendReminders: async function (user_id, standup) {
    const user = await User.findById(user_id)
      .select("email configs.medium_mode")
      .lean();

    if (user.configs.medium_mode == "slack") {
      this.publishSlackMessage(user.email, standup.name);
    }
  },

  processReminders: async function(standups, date) {
    for (const standup of standups) {

      let standup_reminders = standup.reminders.schedules.map(
        async (schedule) => {
          // check if today's a day to send
          if (standup.reminders.days.includes(date.weekday)) {
            if (standup.reminders.staticTime) {
              return schedule.list.map(async (user) => {
                if (user.notification_time < date) {
                  try {
                    await this.sendReminders(user.user_id, standup);

                    let nextReminder = this.nextReminder(
                      user.notification_time,
                      "utc"
                    );

                    return StandUp.findOneAndUpdate(
                      { _id: standup._id },
                      {
                        $set: {
                          "reminders.schedules.$[schedule].list.$[user].notification_time":
                            nextReminder,
                        },
                      },
                      {
                        arrayFilters: [
                          { "schedule._id": schedule._id },
                          { "user.user_id": user.user_id },
                        ],
                      }
                    ).exec();
                  } catch (e) {
                    console.error("Error while sending reminders: ", e.message);
                  }
                }
              })
            } else {
              try {
                if (schedule.list[0].notification_time < date) {
                  await Promise.all(
                    schedule.list[0].user_id.map(async (user) => {
                      return this.sendReminders(user, standup);
                    })
                  );
  
                  let nextReminder = this.nextReminder(
                    schedule.list[0].notification_time,
                    "utc"
                  );
  
                  return StandUp.findOneAndUpdate(
                    { _id: standup._id },
                    {
                      $set: {
                        "reminders.schedules.$[schedule].list.$[].notification_time":
                          nextReminder,
                      },
                    },
                    { arrayFilters: [{ "schedule._id": schedule._id }] }
                  ).exec();
                }
              } catch (e) {
                console.error("Error while sending reminders: ", e.message);
              }
            }
          }
        }
      );

      await Promise.all(standup_reminders)
        .then(console.log("Reminders are successfully sent"))
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
    const standups = await StandUp.find({
      "reminders.schedules.list.notification_time": { $lt: date },
    })
      .select("name reminders")
      .lean();

    console.log("Number of standup with reminders to send: ", standups.length);

    if (standups.length != 0) {
      Reminders.processReminders(standups, date);
    }
  }, null, true, "UTC"
);
