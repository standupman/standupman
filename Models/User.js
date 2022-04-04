import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { DateTime } from 'luxon';

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    validate: {
      validator(username) {
        return /^([a-zA-Z\d_\-.]){4,}$/.test(username);
      },
      message: (props) => `Username must be at least four alphanumeric characters. ${props.value} is not valid.`,
    },
    unique: [true, 'Username already exists!'],
    required: true,
  },
  email: {
    type: String,
    validate: {
      validator(email) {
        return /^([a-zA-Z\d_\-.])+@([a-zA-Z\d_\-.])+\.([a-z]+)$/.test(email);
      },
      message: (props) => `${props.value} is not a valid email. Email must be valid`,
    },
    unique: [true, 'Email already exists!'],
    required: true,
  },
  full_name: {
    type: String,
    minlength: [4, 'Full name  too short'],
    required: [true, 'Full name not present'],
  },
  password: {
    type: String,
    minlength: [4, 'Password too short'],
    required: [true, 'Password not present'],
    hidden: true,
  },
  created_at: {
    type: Date,
  },
  updated_at: {
    type: Date,
  },
  standups: {
    type: Array,
  },
  configs: {
    medium_mode: {
      type: String,
      default: 'email',
      required: [true, 'medium_mode is not present.'],
    },
    timeZone: {
      type: String,
      validate: {
        validator(timeZone) {
          const dt = DateTime.now().setZone(timeZone);
          if (!dt.isValid) throw new Error(dt.invalidExplanation);
        },
        message: (props) => props.reason.message,
      },
      required: [true, 'TimeZone is not present'],
    },
  },

});

// eslint-disable-next-line func-names
UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;
