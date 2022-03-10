import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: {
        type: String,
        validate: {
            validator: function (username) {
                return /^([\a-zA-Z\d_\-.]){4,}$/.test(username);
            },
            message: props => `Username must be at least four alphanumeric characters. ${props.value} is not valid.`
        },
        unique: [true, "Username already exists!"],
        required: true
    },
    email: {
        type: String,
        validate: {
            validator: function (email) {
                return /^([\a-zA-Z\d_\-.])+@([a-zA-Z\d_\-.])+\.([a-z]+)$/.test(email);
            },
            message: props => `${props.value} is not a valid email. Email must be valid`
        },
        unique: [true, "Email already exists!"],
        required: true
    },
    full_name: {
        type: String,
        minlength: [4, 'Full name  too short'],
        required: [true, 'Full name not present']
    },
    password: {
        type: String,
        minlength: [4, 'Password too short'],
        required: [true, 'Password not present'],
        hidden: true
    },
    created_at: {
        type: Date,
    },
    updated_at: {
        type: Date
    },
    standups: {
        type: Array
    },
    timeZone: {
        type: String,
        required: [true, 'TimeZone is not present']
    }

});


UserSchema.methods.validatePassword = function (password) {
    console.log(this.password)
    console.log(password);
    return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;