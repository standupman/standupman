
import { Router } from 'express'
import publicController from '../Controllers/PublicController.js'
import standUpController from '../Controllers/StandUpController.js'
import userController from '../Controllers/UserController.js'
import authenticationController from '../Controllers/AuthenticationController.js'
import auth from '../Middlewares/AuthMiddleware.js'
import { body } from 'express-validator'

const router = Router()
const authMiddleware = auth.authenticate('jwt', { session: false });

/**
 * @openapi
 * /:
 *   get:
 *     description: Welcome to standupman api!
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.get('/', publicController.welcome);

/**
 * @openapi
 * /standups:
 *   get:
 *     description: Get standups
 *     tags: [Standup]
 *     responses:
 *       200:
 *         description: Returns list of standups
 *         schema:
 *           type: object
 *           standups:
 *             $ref: '#/definitions/Standup'
 */
router.get('/standups', authMiddleware, standUpController.standUpList);

/**
 * @openapi
 * /standups/responses:
 *   get:
 *     description: Get standup responses
 *     tags: [Standup]
 *     responses:
 *       200:
 *         description: Returns list of standup responses
 *         schema:
 *           type: object
 *           standUpResponses:
 *             $ref: '#/definitions/StandupUpdate'
 */
router.get('/standups/responses', authMiddleware, standUpController.standUpResponses);

/**
 * @openapi
 * /standups/new:
 *   post:
 *     description: Create new standup
 *     tags: [Standup]
 *     parameters:
 *       $ref: '#/definitions/Standup'
 *     responses:
 *       200:
 *         description: Returns newly created standup
 *         schema:
 *           type: object
 *           standup:
 *             $ref: '#/definitions/Standup'
 */
router.post('/standups/new', [
    body('standup').isObject(),
    authMiddleware
], standUpController.createNewStandUp);

/**
 * @openapi
 * /standups/delete:
 *   post:
 *     tags: [Standup]
 *     description: Not yet implemented
 */
router.post('/standups/delete', authMiddleware, standUpController.deleteStandUp);

/**
 * @openapi
 * /standups/subscribe:
 *   post:
 *     description: Subscribe to a standup
 *     tags: [Standup]
 *     parameters:
 *       name: standup_id
 *       $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: Return user
 *         schema:
 *           type: object
 *           user:
 *             $ref: '#/definitions/User'
 *           success:
 *              type: string
 */
router.post('/standups/subcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.subscribeToStandUp);

/**
 * @openapi
 * /standups/unsubcribe:
 *   post:
 *     description: Unsubscribe to a standup
 *     tags: [Standup]
 *     parameters:
 *       name: standup_id
 *       $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: Return user
 *         schema:
 *           type: object
 *           user:
 *             $ref: '#/definitions/User'
 *           success:
 *              type: string
 */
router.post('/standups/unsubcribe', [
    body('standup_id').isString(),
    authMiddleware
], standUpController.unsubscribeToStandUp);

/**
 * @openapi
 * /standups/update:
 *   post:
 *     description: Update a standup
 *     tags: [Standup]
 *     parameters:
 *       name: standup_id
 *       $ref: '#/definitions/Standup'
 *     responses:
 *       200:
 *         description: Return standup
 *         schema:
 *           type: object
 *           StandUp:
 *             $ref: '#/definitions/Standup'
 */
router.post('/standups/update', [
    body('standup').isObject(),
    authMiddleware
], standUpController.updateStandUp);

/**
 * @openapi
 * /standups/update:
 *   post:
 *     description: Complete standup update
 *     tags: [Standup]
 *     parameters:
 *       $ref: '#/definitions/StandupUpdate'
 *     responses:
 *       200:
 *         description: Return standup update
 *         schema:
 *           type: object
 *           StandUp:
 *             $ref: '#/definitions/StandupUpdate'
 */
router.post('/standups/complete', [
    body('standup_update').isObject(),
    authMiddleware
], standUpController.completeStandUp);

/**
 * @openapi
 * /users:
 *   get:
 *     description: Get users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Return users
 *         schema:
 *           type: object
 *           users:
 *             $ref: '#/definitions/User'
 */
router.get('/users', authMiddleware, userController.users);

//Authentication routes

/**
 * @openapi
 * /login:
 *   post:
 *     description: Login User
 *     tags: [Authentication]
 *     parameters:
 *       $ref: '#/definitions/Login'
 *     responses:
 *       200:
 *         schema:
 *           type: object
 *           user:
 *             $ref: '#/definitions/Login'
 */
router.post('/login', authenticationController.login);

/**
 * @openapi
 * /users/register:
 *   post:
 *     description: Register User
 *     tags: [Authentication]
 *     parameters:
 *       $ref: '#/definitions/Register'
 *     responses:
 *       200:
 *         schema:
 *           type: object
 *           user:
 *             $ref: '#/definitions/User'
 */
router.post('/users/register', [
    body('user').isObject(),
    body('user.username').isString(),
    body('user.email').isEmail(),
    body('user.password').isString(),
], authenticationController.createUser);

export default router;