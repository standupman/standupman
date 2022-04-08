/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
import { DateTime } from 'luxon';

import StandUp from '../../Models/StandUp';

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
   * compares two ISODate time value
   * @param {Date} datetime1 - ISODate
   * @param {Date} datetime2 - ISODate
   * @returns {Boolean}
   */
  checkTimeEqual: function (datetime1, datetime2) {
    return datetime1.substring(11, 19) === datetime2.substring(11, 19);
  },

  /**
   * checks request schedule time object
   * @param {Object} schedule - Schedule time object
   * @returns {Boolean|Error}
   */
  checkTimeOption: function (schedule) {
    if (String(Object.keys(schedule.time)) === 'hour,min') {
      const { hour, min } = schedule.time;
      if (hour < 0 || hour > 23 || min < 0 || min > 59) {
        throw new Error('Specify time hour range to be 0 - 23 and min to be 0 - 59');
      }
      return true;
    }
    throw new Error(
      'Schedule time must be specified in the form of '
      + '{ "time" : { "hour" : xx, "min": xx }}',
    );
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
   * sorts an array by its element
   * @param {Array} array - The array of values to be sorted
   * @param {Boolean} prop - Sort with specific reminder schedules object
   * @returns {Array} - Sorted array
   */
  sortArr: function (array, prop = false) {
    if (prop) {
      return array.sort((a, b) => a.time.hour - b.time.hour || a.time.min - b.time.min);
    }
    return array.sort();
  },

  /**
   * update standup reminders based on user action
   * @param {Object} user - User object (document)
   * @param {Array} standups - The array of standup IDs user is associated with
   * @param {Boolean} remove - Remove user from list of scheduled reminders
   * @param {Boolean} generate - Add user to list of scheduled reminders
   * @returns {} - No return
   */
  updateStandUpRemindersByUser: function (
    user,
    standups,
    remove = false,
    generate = false,
  ) {
    standups.forEach(async (standupId) => {
      const standUp = await StandUp.findById(standupId).select('reminders');
      if (standUp.reminders.schedules.length !== 0) {
        if (remove) {
          await StandUp.findByIdAndUpdate(standupId, {
            $pull: {
              'reminders.schedules.$[].notification.users': user._id,
            },
          }).exec();
        }

        if (generate) {
          await StandUp.findByIdAndUpdate(standupId, {
            $push: {
              'reminders.schedules.$[].notification.users': user._id,
            },
          }).exec();
        }
      }
    });
  },
};

export default StandUpHelpers;
