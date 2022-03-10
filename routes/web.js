import publicController from '../Controllers/PublicController.js'
import standUpController from '../Controllers/StandUpController.js'
import userController from '../Controllers/UserController.js'
import authenticationController from '../Controllers/AuthenticationController.js'
import auth from '../Middlewares/AuthMiddleware.js'

import { Router } from 'express'
import { body, query } from 'express-validator'

const router = Router()
const authMiddleware = auth.authenticate('basic', { session: false });


router.get('/', publicController.welcome);
router.post("/standups/new", [
    body("standup").isObject(),
    authMiddleware,
  ],
  standUpController.createNewStandUp.bind(standUpController)
);
router.get('/standups', authMiddleware, standUpController.standUpList);
router.get('/standups/responses', authMiddleware, standUpController.standUpResponses);
router.get('/standups/reminders', authMiddleware, standUpController.listStandupReminders);
router.delete('/standups/reminders/:reminderId?', authMiddleware, standUpController.deleteStandupReminder);
router.post('/standups/subcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.subscribeToStandUp.bind(standUpController));
router.post('/standups/unsubcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.unsubscribeToStandUp);
router.put('/standups/update', [
    body('standup').isObject(),
    query('standupId').isString().withMessage('Please state a supported query param!'),
    authMiddleware
], standUpController.updateStandUp.bind(standUpController));
router.post('/standups/complete', [
    body('standup_update').isObject(),
    authMiddleware
], standUpController.completeStandUp);
router.delete('/standups/:standupId?', [
    query('standupId').isString().withMessage('Please state a supported query param!'),
    authMiddleware
], standUpController.deleteStandUp);
router.get('/users', authMiddleware, userController.users);
router.put('/users/config/:userId?', [
    query('userId').isString().withMessage('Please state a supported query param!'),
    body('userconfig').isObject(),
    authMiddleware], userController.setUserConfig)
router.get('/users/config/:userId?', [
    query('userId').isString().withMessage('Please state a supported query param!'),
    authMiddleware], userController.getUserConfig)

//Authentication routes

router.post('/login', authMiddleware, authenticationController.login);
router.post('/users/register', [
    body('user').isObject(),
    body('user.username').isString(),
    body('user.email').isEmail(),
    body('user.password').isString(),
], authenticationController.createUser);

export default router;