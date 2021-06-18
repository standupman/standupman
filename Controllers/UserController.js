const User = require('../Models/User');
const { validationResult } = require('express-validator');

module.exports = {
  
    users: (req, res) => {
        User.find().then(users => {
            res.json({users:users});
        })
      },

    subscribeToScrum: (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
    
      
    }
}