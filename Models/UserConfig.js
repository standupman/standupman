import mongoose from 'mongoose'
const Schema = mongoose.Schema

const UserConfigSchema = new Schema({
    user_id: {
        type: String,
        minlength: [4, 'user id too short'],
        required: [true, 'user_id not present.']
    },
    medium_mode: {
        type: String,
        default: "email",
        required: [true, 'medium_mode is not present.']
    }
});

const UserConfig = mongoose.model('UserConfig', UserConfigSchema);
export default UserConfig;
