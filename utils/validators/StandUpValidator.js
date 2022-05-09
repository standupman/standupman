import { DateTime } from 'luxon';

import StandUp from '../../Models/StandUp';
import StandUpHelpers from '../helpers/StandUpHelpers';

const constValidators = {
  name: {
    in: ['body'],
    isString: {
      errorMessage: 'name must be a string',
    },
  },
  completionTime: {
    in: ['body'],
    isDate: {
      options: {
        format: 'YYYY-MM-DD',
        strictMode: true,
      },
      errorMessage: 'date must be in the format YYYY-MM-DD',
    },
  },
  questions: {
    in: ['body'],
    isObject: {
      errorMessage: 'request questions object must be present',
    },
    custom: {
      options: (value) => {
        const questionIds = Object.keys(value);
        if (questionIds.length < 1) {
          return false;
        }
        return questionIds.every((id, idx) => {
          if (String(id) !== `question_${idx + 1}`) {
            return false;
          }
          if (Object.keys(value[id]).length < 2) {
            return false;
          }
          if (
            value[id].title === undefined
            || value[id].response_type === undefined
          ) {
            return false;
          }
          return true;
        });
      },
      errorMessage:
        'A minimum of one question must be present in the form of: '
        + '{ question_1: {title: "What did you do today", response_type: "String"}}. '
        + 'Question id must be incremental, starting from question_1, question_2 ...',
    },
  },
  'reminders.timeZone': {
    in: ['body'],
    custom: {
      options: (value, { req }) => {
        if (req.body.reminders) {
          if (
            req.body.reminders.schedules !== undefined
              && req.body.reminders.schedules.length !== 0
          ) {
            if (!value) throw new Error('A timeZone of IANA type is required.');

            const dt = DateTime.now().setZone(value);
            if (!dt.isValid) throw new Error(dt.invalidExplanation);
          }
          return true;
        }
        return true;
      },
    },
  },
  'reminders.days': {
    in: ['body'],
    optional: { options: { nullable: true } },
    custom: {
      options: (value, { req }) => {
        if (Array.isArray(value) && value.length < 8) {
          const allowed = [1, 2, 3, 4, 5, 6, 7];
          const check = value.every((day) => allowed.includes(day));
          if (!check) throw new Error(`The allowed days are only: ${allowed}`);

          const unique = new Set(value);
          if (unique.size !== value.length) {
            throw new Error('Duplicated days are not allowed');
          }

          req.body.reminders.days = StandUpHelpers.sortArr(value);
          return true;
        }
        throw new Error(
          'days must be array with max length of 7. '
          + 'The allowed values are numeric values ranging from 1 - 7.',
        );
      },
    },
  },
  'reminders.schedules': {
    in: ['body'],
    optional: { options: { nullable: true } },
    custom: {
      options: (value, { req }) => {
        if (value.length > 3) {
          throw new Error(
            'Only a maximum of 3 reminders can be scheduled for a single standup.',
          );
        }

        value.forEach((schedule) => {
          if (String(Object.keys(schedule)) === 'time') {
            StandUpHelpers.checkTimeOption(schedule);
          } else {
            throw new Error(
              `${Object.keys(schedule)} is not a valid key! `
                  + 'Schedule time must be specified in the form of '
                  + '{ "time" : { "hour" : xx, "min": xx }}',
            );
          }
        });

        req.body.reminders.schedules = StandUpHelpers.sortArr(value, true);
        return true;
      },
    },
  },
};

const StandUpValidator = {
  post: {
    ...constValidators,
  },
  put: {
    id: {
      in: ['params'],
      isMongoId: {
        errorMessage: 'standup id specified is not a valid id',
      },
      custom: {
        options: async (value, { req }) => {
          const standUp = await StandUp.findById(value).select('reminders');

          if (!standUp) {
            throw new Error(`StandUp of id '${value}' not found!`);
          }
          req.standUp = standUp;
        },
      },
    },
    ...constValidators,
  },
};

export default StandUpValidator;
