const express = require('express');
const router = express.Router();
const publicController = require('../Controllers/PublicController');
const scrumController = require('../Controllers/ScrumController');
const userController = require('../Controllers/UserController');
const authenticationController = require('../Controllers/AuthenticationController');
const authMiddleware = require('../Middlewares/AuthMiddleware').authenticate('basic', { session: false });
const { body } = require('express-validator');


router.get('/', publicController.welcome);
router.post('/new/scrum', authMiddleware, scrumController.createNewScrum);
router.get('/scrums', authMiddleware, scrumController.scrumList);
router.post('/scrums/subcribe', body('scrum_id').isString(), authMiddleware, scrumController.subscribeToScrum);
router.post('/scrum/update/:id', authMiddleware, scrumController.updateScrum);
router.post('/complete/scrum/:id', authMiddleware, scrumController.completeScrum);
router.get('/users',  authMiddleware, userController.users);

//Authentication routes

router.post('/login', authMiddleware, authenticationController.login);
router.post('/user/register',  authenticationController.createUser);

module.exports = router;