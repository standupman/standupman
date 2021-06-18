const StandUp = require('../Models/StandUp');
const { validationResult } = require('express-validator');

module.exports = {
    createNewStandUp: (req, res) => {
        StandUp.create(req.body.StandUp).then((StandUp) => {
            res.json({ StandUp });
        }).catch((error) => {
            res.json({ StandUp: {message: "There was an error creating new StandUp", errorDetails: error} });
        });

    },
    StandUpList: async (req, res) => {
        let StandUps = await StandUp.find();
        res.json({ 'StandUps': StandUps });

    },
    updateStandUp: (req, res) => {
        res.json({ StandUp: [] })
    },
    completeStandUp: (req, res) => {
        res.json({ 'StandUp': [] });
    },
    subscribeToStandUp: (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
    
    }
}