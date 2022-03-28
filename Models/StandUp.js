import mongoose from 'mongoose';

const { Schema } = mongoose;

const StandUpSchema = new Schema({
  name: {
    type: String,
    minlength: [4, 'StandUp name too short'],
    required: [true, 'StandUp name not present'],
  },
  description: String,
  completionTime: {
    type: Date,
    required: [true, 'CompletionTime must be present'],
  },
  questions: {
    type: Object,
    validate: {
      validator(input) {
        const questions = input;
        const keys = Object.keys(questions);
        if (keys.length < 1) {
          return false;
        }

        for (let i = 0; i < keys.length; i += 1) {
          if (Object.keys(questions[keys[i]]).length < 2) {
            return false;
          }
          if (questions[keys[i]].title === undefined) {
            return false;
          }
          if (questions[keys[i]].response_type === undefined) {
            return false;
          }
        }

        return true;
      },
      message:
        'A minimum of one question must be present with the form { question_1: {title: "What did you do today", response_type: "String"}, question_2: {title: "How many hours did you work today", response_type: "Number"}}',
    },
    required: [true, 'Questions object not present'],
  },
  user_id: String,
});

const StandUp = mongoose.model('StandUp', StandUpSchema);
export default StandUp;
