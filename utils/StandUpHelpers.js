/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
import { DateTime } from 'luxon';

import StandUp from '../Models/StandUp';

const StandUpHelpers = {
  /**
   * generates a date
   * @param {Object} time - An object containing hour, min to set datetime
   * @param {String} timeZone - Set the datetime to a specific timezone
   * @returns {DateTime} - A DateTime Object
   */
  genDate: function (time, timeZone) {
    return DateTime.fromObject(
      {
        hour: time.hour,
        minute: time.min,
      },
      { zone: timeZone },
    )
      .toUTC()
      .plus({ days: 1 });
  },

  /**
   * find difference of arr2 against arr1
   * @param {Array} arr1 - Array to check against
   * @param {Array} arr2 - Array to be checked
   * @returns {Array} - Differences contained in arr2 but not in arr1
   */
  remindersArrDiff: function (arr1, arr2) {
    return arr2.filter((arr2Obj) => !arr1.some((arr1Obj) => {
      // check update reminder exists
      if (typeof arr2Obj === 'string') {
        return arr2Obj === String(arr1Obj._id);
      }
      // reminder
      return String(arr2Obj._id) === String(arr1Obj._id);
    }));
  },

  /**
   * update standup reminders based on user action
   * @param {Object} user - User object (document)
   * @param {Array} standups - The array of standup IDs user is associated with
   * @param {Boolean} remove - Remove user from list of scheduled reminders
   * @param {Boolean} generate - Add user to list of scheduled reminders
   * @param {Boolean} switchZone - Only affect standups with staticTime
   * @returns {} - No return
   */
  updateStandUpRemindersByUser: function (
    user,
    standups,
    remove = false,
    generate = false,
    switchZone = false,
  ) {
    standups.forEach(async (standupId) => {
      const standUp = await StandUp.findById(standupId).select('reminders');
      if (standUp.reminders.schedules.length !== 0) {
        if (standUp.reminders.staticTime) {
          if (remove) {
            await StandUp.findByIdAndUpdate(standupId, {
              $pull: { 'reminders.schedules.$[].list': { user_id: user._id } },
            }).exec();
          }

          if (generate) {
            await Promise.all(
              standUp.reminders.schedules.map((schedule) => {
                const userRem = {
                  user_id: user._id,
                  notification_time: this.genDate(
                    schedule.time,
                    user.configs.timeZone,
                  ),
                };
                return StandUp.findOneAndUpdate(
                  { _id: standupId },
                  {
                    $push: {
                      'reminders.schedules.$[schedule].list': userRem,
                    },
                  },
                  {
                    arrayFilters: [{ 'schedule._id': schedule._id }],
                  },
                );
              }),
            );
          }
        }
        if (!switchZone) {
          if (remove) {
            await StandUp.findByIdAndUpdate(standupId, {
              $pull: { 'reminders.schedules.$[].list.$[].user_id': user._id },
            }).exec();
          }

          if (generate) {
            await StandUp.findByIdAndUpdate(standupId, {
              $push: { 'reminders.schedules.$[].list.$[].user_id': user._id },
            }).exec();
          }
        }
      }
    });
  },
};

export default StandUpHelpers;
