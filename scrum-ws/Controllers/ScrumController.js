const Scrum = require('../Models/Scrum');
module.exports = {
    createNewScrum: (req, res) => {
        Scrum.create({
            name: req.body.name,
            description: req.body.description,
            completionTime: req.body.completionTime,
            questions: req.body.questions,
            user_id: req.body.user_id
        }).then((scrum) => {
            res.json({ scrum });
        }).catch((error) => {
            res.json({ scrum: {message: "There was an error creating new scrum", errorDetails: error} });
        });

    },
    scrumList: (req, res) => {
        res.json({ 'scrums': [] });

    },
    updateScrum: (req, res) => {
        res.json({ scrum: [] })
    },
    completeScrum: (req, res) => {
        res.json({ 'scrum': [] });
    }
}