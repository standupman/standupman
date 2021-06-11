const express = require('express');
const router = express.Router();
const publicController = require('../Controllers/PublicController');
const scrumController = require('../Controllers/ScrumController');

router.get('/', publicController.welcome);
router.post('/new/scrum', scrumController.createNewScrum);
router.get('/scrums', scrumController.scrumList);
router.post('/scrum/update/:id', scrumController.updateScrum);
router.post('/complete/scrum/:id', scrumController.completeScrum);

module.exports = router;