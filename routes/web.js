const express = require('express');
const router = express.Router();
const publicController = require('../Controllers/PublicController');
const StandUpController = require('../Controllers/StandUpController');
const userController = require('../Controllers/UserController');
const authenticationController = require('../Controllers/AuthenticationController');
const authMiddleware = require('../Middlewares/AuthMiddleware').authenticate('basic', { session: false });
const { body } = require('express-validator');


router.get('/', publicController.welcome);
router.post('/new/StandUp', authMiddleware, StandUpController.createNewStandUp);
router.get('/StandUps', authMiddleware, StandUpController.StandUpList);
router.post('/StandUps/subcribe', body('StandUp_id').isString(), authMiddleware, StandUpController.subscribeToStandUp);
router.post('/StandUp/update/:id', authMiddleware, StandUpController.updateStandUp);
router.post('/complete/StandUp/:id', authMiddleware, StandUpController.completeStandUp);
router.get('/users',  authMiddleware, userController.users);

//Authentication routes

router.post('/login', authMiddleware, authenticationController.login);
router.post('/user/register',  authenticationController.createUser);

module.exports = router;