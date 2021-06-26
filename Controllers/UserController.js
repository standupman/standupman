import User from '../Models/User.js'
import { validationResult } from 'express-validator';

export default {
  
    users: (req, res) => {
        User.find().then(users => {
            res.json({users:users});
        })
      },

    subscribeToStandUp: (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
    
      
    }
}