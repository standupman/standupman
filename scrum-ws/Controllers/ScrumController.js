const Scrum = require('../Models/Scrum');
const { validationResult } = require('express-validator');

module.exports = {
    createNewScrum: (req, res) => {
        Scrum.create(req.body.scrum).then((scrum) => {
            res.json({ scrum });
        }).catch((error) => {
            res.json({ scrum: {message: "There was an error creating new scrum", errorDetails: error} });
        });

    },
    scrumList: async (req, res) => {
        let scrums = await Scrum.find();
        res.json({ 'scrums': scrums });

    },
    updateScrum: (req, res) => {
        res.json({ scrum: [] })
    },
    completeScrum: (req, res) => {
        res.json({ 'scrum': [] });
    },
    subscribeToScrum: (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
    
    }
}