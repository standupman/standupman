/* eslint-disable no-underscore-dangle */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */
import { CronJob } from 'cron';
import { DateTime } from 'luxon';

import User from '../Models/User';
import StandUp from '../Models/StandUp';
import { boltApp } from '../mode/slack/app';

const Reminders = {
  publishSlackMessage: async function (email, standupName) {
    try {
      const slackUser = await boltApp.client.users.lookupByEmail({
        email: email,
      });
      const openChannel = await boltApp.client.conversations.open({
        users: slackUser.user.id,
      });

      boltApp.client.chat.postMessage({
        channel: openChannel.channel.id,
        text: `Hey <@${slackUser.user.name}> :wave:\nDo remember to submit your standup for ${standupName} through invoking \`/standup-notes post\``,
      });
    } catch (error) {
      console.error(error);
    }
  },

  sendReminders: async function (userId, standup) {
    const user = await User.findById(userId)
      .select('email configs.medium_mode')
      .lean();

    if (user.configs.medium_mode === 'slack') {
      this.publishSlackMessage(user.email, standup.name);
    }
  },

  processReminders: async function (standups, date) {
    // eslint-disable-next-line consistent-return
    const batchProcess = standups.map(async (standup) => {
      if (standup.reminders.days.includes(date.weekday)) {
        // eslint-disable-next-line consistent-return
        return standup.reminders.schedules.map(async (schedule) => {
          try {
            if (schedule.notification.time < date) {
              await Promise.all(
                schedule.notification.users.map(async (user) => this.sendReminders(user, standup)),
              );

              const nextReminder = this.nextReminder(
                schedule.notification.time,
                'utc',
              );

              return StandUp.findOneAndUpdate(
                { _id: standup._id },
                {
                  $set: {
                    'reminders.schedules.$[schedule].notification.time':
                        nextReminder,
                  },
                },
                { arrayFilters: [{ 'schedule._id': schedule._id }] },
              ).exec();
            }
          } catch (e) {
            console.error('Error while sending reminders: ', e.message);
          }
        });
      }
    });

    return Promise.all(batchProcess);
  },

  nextReminder: function (date, zone) {
    return DateTime.fromJSDate(date, { zone: zone }).plus({ days: 1 });
  },
};

const remindersJob = new CronJob('*/3 * * * *', async () => {
  const date = DateTime.utc();
  const standups = await StandUp.find({
    'reminders.schedules.notification.time': { $lt: date },
  })
    .select('name reminders')
    .lean();

  // console.log('Number of standup with reminders to send: ', standups.length);

  if (standups.length !== 0) {
    await Reminders.processReminders(standups, date);
  }
}, null, false, 'UTC');

export default remindersJob;
