const StandUp = require('../Models/StandUp');
const StandUpUpdate = require('../Models/StandUpUpdate');
const User = require('../Models/User');
const { validationResult } = require('express-validator');

module.exports = {
    createNewStandUp: (req, res) => {
        StandUp.create(req.body.StandUp).then((StandUp) => {
            res.json({ StandUp });
        }).catch((error) => {
            res.json({ StandUp: { message: "There was an error creating new StandUp", errorDetails: error } });
        });

    },
    deleteStandUp: (req, res) => {

    },
    standUpList: async (req, res) => {
        let standUps = await StandUp.find();
        res.json({ 'standups': standUps });

    },
    standUpResponses: async (req, res) => {
        let responses = null;
        if(req.query.standup_id) {
            responses = await StandUpUpdate.find({"standup_id": req.query.standup_id });
            res.json({ standUpResponses: responses });
        }

        responses = await StandUpUpdate.find();
        res.json({ standUpResponses: responses });

    },
    updateStandUp: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup.id });
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            standUp = await StandUp.findOneAndUpdate({ _id: standUp.id }, req.body.standup, {new: true, runValidators: true});
            // StandUp.findOneAndUpdate()
        } catch (e) {
            return res.status(404).json({ message: "Error updating standup!", errors: e.message });
        }

        res.json({ 'StandUp': standUp });
    },
    completeStandUp: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        StandUpUpdate.create(req.body.standup_update).then((standUpUpdate) => {
            res.json({ 'standUpUpdate': standUpUpdate });
        }).catch((error) => {
            res.json({ StandUp: { message: "There was an error creating new StandUp", errorDetails: error } });
        });
        
       
    },
    subscribeToStandUp: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup_id });
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }

        if (user.standups.length > 0) {
            if (user.standups.indexOf(standUp.id) > -1) {
                return res.status(409).json({ 'success': false, message: "User already subscribed", user: user });
            }
        }

        try {
            user.standups.push(standUp.id);
            user = await User.findOneAndUpdate({ username: user.username }, {$set:{standups : user.standups}}, {new: true});
        } catch (e) {
            return res.status(404).json({ message: "Error subscribing user to standup!", errors: e.message });
        }

        return res.json({ 'success': true, user: user });

    },
    unsubscribeToStandUp : async(req, res) => {

        try {
            var standUp = await StandUp.findOne({ _id: req.body.standup_id });
        } catch (e) {
            return res.status(404).json({ message: "StandUp not found!", errors: e.message });
        }

        try {
            var user = await User.findOne({ username: req.user.username });
        } catch (e) {
            return res.status(500).json({ message: "Error getting user", errors: e.message });
        }


        if (user.standups.length > 0) {
            var scrumIndex = user.standups.indexOf(standUp.id);
            if (scrumIndex === -1) {
                return res.status(409).json({ 'success': false, message: "User not subscribed to scrum", user: user });
            } 
        }

        try {
            user.standups = user.standups.slice(0,scrumIndex).concat(user.standups.slice(scrumIndex+1))
            user = await User.findOneAndUpdate({ username: user.username }, {$set:{standups : user.standups}}, {new: true});
        } catch (e) {
            return res.status(404).json({ message: "Error subscribing user to standup!", errors: e.message });
        }

        return res.json({ 'success': true, user: user });

    }
}