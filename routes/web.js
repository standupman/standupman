
import { Router } from 'express'
import publicController from '../Controllers/PublicController.js'
import standUpController from '../Controllers/StandUpController.js'
import userController from '../Controllers/UserController.js'
import authenticationController from '../Controllers/AuthenticationController.js'
import auth from '../Middlewares/AuthMiddleware.js'
import { body } from 'express-validator'

const router = Router()
const authMiddleware = auth.authenticate('basic', { session: false });


router.get('/', publicController.welcome);
router.post('/standups/new', [
    body('standup').isObject(),
    //authMiddleware
], standUpController.createNewStandUp);
router.delete('/standups/delete/:id', authMiddleware, standUpController.deleteStandUp);
router.get('/standups', standUpController.standUpList);
router.get('/standups/responses', authMiddleware, standUpController.standUpResponses);
router.post('/standups/subcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.subscribeToStandUp);
router.post('/standups/unsubcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.unsubscribeToStandUp);
router.post('/standups/update', [
    body('standup').isObject(),
    authMiddleware
], standUpController.updateStandUp);
router.post('/standups/complete', [
    body('standup_update').isObject(),
    authMiddleware
], standUpController.completeStandUp);
router.get('/users', userController.users);

//Authentication routes

router.post('/login', authMiddleware, authenticationController.login);
router.post('/users/register', [
    body('user').isObject(),
    body('user.username').isString(),
    body('user.email').isEmail(),
    body('user.password').isString(),
], authenticationController.createUser);

export default router;