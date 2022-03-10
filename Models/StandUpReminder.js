import mongoose from 'mongoose'
const Schema = mongoose.Schema

const StandUpReminderSchema = new Schema({
  standup_id: {
    type: String,
    minlength: [4, "standup id too short"],
    required: [true, "standup_id not present."],
  },
  reminder_list: {
    type: [
      {
        user_id: Object,
        notification_time: Date,
        last_modified: { type: Date, default: null },
      },
    ],
    default: [],
  },
  destination: String,
});

StandUpReminderSchema.index({ "reminder_list.notification_time": 1 }, { name: "reminder_listIdx"});

const StandUpReminder = mongoose.model('StandUpReminder', StandUpReminderSchema);
export default StandUpReminder;
