import User from '../Models/User.js'
import bcrypt from 'bcrypt'
import { validationResult } from 'express-validator'


export default {
    login: (req, res) => {
       // res.json({username: req.body.username, password: req.body.password});
       let user = Object.assign({}, req.user)._doc;
       delete user.password;
       res.json(user); 
    },
    logout: (req, res) => {
        req.logout();
        res.redirect('/');
    },
    createUser : (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        let user = req.body.user;
        let salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(user.password, salt);
        User.create(user).then(user => {
            res.json({user:user});
        }).catch(errors => {
            res.json({message: "User not created", errors:errors});
        });
     }
};