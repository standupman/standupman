import mongoose from 'mongoose';

const { Schema } = mongoose;

const SlackInstallationSchema = new Schema({
  _id: String,
  installation: Object,
});

const SlackInstallation = mongoose.model('SlackInstallation', SlackInstallationSchema);
export default SlackInstallation;
