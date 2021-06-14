const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        validate: {
            validator: function (username) {
            },
            message : "Email must be valid"
        },
        required: [true, 'A unique username must be provided']
    },
    email: {
        type: String,
        validate: {
            validator: function (email) {
                return /^([\a-zA-Z\d_\-.])+@([a-zA-Z\d_\-.])+\.([a-z]+)$/.test(email);
            },
            message : "Email must be valid"
        },
        required: [true, 'Email must be present']
    },
    full_name: {
        type: String,
        minlength: [4, 'Full name  too short'],
        required: [true, 'Full name not present']
    },
    password: {
        type: String,
        minlength: [4, 'Password too short'],
        required: [true, 'Password not present']
    },
    created_at: {
        type: Date,
    },
    updated_at: {
        type: Date
    }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;