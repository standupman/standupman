import StandUp from '../Models/StandUp.js'
import StandUpUpdate from '../Models/StandUpUpdate.js'
import User from '../Models/User.js'
import { validationResult } from 'express-validator';

class StandUpController {
    
    createNewStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        StandUp.create(req.body.standup).then(standup => {
            res.json({ standup });
        }).catch((error) => {
            res.json({ standup: { message: "There was an error creating new StandUp", errorDetails: error } });
        });

    }

    deleteStandUp (req, res) {

    }

    async standUpList (req, res) {
        let standUps = await StandUp.find();
        res.json({ 'standups': standUps });

    }

    async standUpResponses (req, res) {
        let responses = null;
        if(req.query.standup_id) {
            responses = await StandUpUpdate.find({"standup_id": req.query.standup_id });
            res.json({ standUpResponses: responses });
        }

        responses = await StandUpUpdate.find();
        res.json({ standUpResponses: responses });

    }

    async updateStandUp (req, res) {
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
    }

    async completeStandUp (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        StandUpUpdate.create(req.body.standup_update).then((standUpUpdate) => {
            res.json({ 'standUpUpdate': standUpUpdate });
        }).catch((error) => {
            res.json({ StandUp: { message: "There was an error creating new StandUp", errorDetails: error } });
        });
        
       
    }

    async subscribeToStandUp (req, res) {
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

    }

    async unsubscribeToStandUp (req, res) {

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

export default new StandUpController();