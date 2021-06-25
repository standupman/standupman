const express = require('express');
const router = express.Router();
const publicController = require('../Controllers/PublicController');
const StandUpController = require('../Controllers/StandUpController');
const userController = require('../Controllers/UserController');
const authenticationController = require('../Controllers/AuthenticationController');
const authMiddleware = require('../Middlewares/AuthMiddleware').authenticate('basic', { session: false });
const { body } = require('express-validator');


router.get('/', publicController.welcome);
router.post('/standups/new', authMiddleware, StandUpController.createNewStandUp);
router.post('/standups/delete', authMiddleware, StandUpController.deleteStandUp);
router.get('/standups', authMiddleware, StandUpController.standUpList);
router.get('/standups/responses', authMiddleware, StandUpController.standUpResponses);
router.post('/standups/subcribe', [
    body('standup_id').isString(),
    authMiddleware
], StandUpController.subscribeToStandUp);
router.post('/standups/unsubcribe', [
    body('standup_id').isString(),
    authMiddleware
], StandUpController.unsubscribeToStandUp);
router.post('/standups/update', [
    body('standup').isObject(),
    authMiddleware
], StandUpController.updateStandUp);
router.post('/standups/complete', [
    body('standup_update').isObject(),
    authMiddleware
], StandUpController.completeStandUp);
router.get('/users', authMiddleware, userController.users);

//Authentication routes

router.post('/login', authMiddleware, authenticationController.login);
router.post('/user/register', authenticationController.createUser);

module.exports = router;