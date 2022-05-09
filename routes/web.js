import { Router } from 'express';
import { body, checkSchema } from 'express-validator';

import publicController from '../Controllers/PublicController';
import standUpController from '../Controllers/StandUpController';
import userController from '../Controllers/UserController';
import authenticationController from '../Controllers/AuthenticationController';
import auth from '../Middlewares/AuthMiddleware';
import StandUpValidator from '../utils/validators/StandUpValidator';

const router = Router();
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Standup'
 */
router.get('/standups', authMiddleware, standUpController.standUpList);

/**
 * @openapi
 * /standups/new:
 *   post:
 *     description: Create new standup
 *     tags: [Standup]
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateStandupReq'
 *     responses:
 *       200:
 *         description: Returns newly created standup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Standup'
 *             examples:
 *                 basic:
 *                   $ref: '#/components/examples/basic_standup_res'
 *                 standup_with_reminders:
 *                   $ref: '#/components/examples/standup_with_reminders_res'
 */
router.post('/standups/new', [
  checkSchema(StandUpValidator.post),
  authMiddleware,
], standUpController.createNewStandUp.bind(standUpController));

/**
 * @openapi
 * /standups/{id}:
 *   delete:
 *     tags: [Standup]
 *     description: Deletes a standup
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Returns the successful deleted standup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Standup'
 *   put:
 *     tags: [Standup]
 *     description: Updates a standup
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateStandupReq'
 *     responses:
 *       200:
 *         description: Returns the successful updated standup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Standup'
 *             examples:
 *                 basic:
 *                   $ref: '#/components/examples/basic_standup_res'
 *                 standup_with_reminders:
 *                   $ref: '#/components/examples/standup_with_reminders_res'
 */
router.delete('/standups/:id', authMiddleware, standUpController.deleteStandUp);
router.put('/standups/:id', [
  checkSchema(StandUpValidator.put),
  authMiddleware,
], standUpController.updateStandUp.bind(standUpController));

/**
 * @openapi
 * /standups/responses:
 *   get:
 *     description: Get standup responses
 *     tags: [Standup]
 *     responses:
 *       200:
 *         description: Returns list of standup responses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StandupResponse'
 */
router.get('/standups/responses', authMiddleware, standUpController.standUpResponses);

/**
 * @openapi
 * /standups/complete:
 *   post:
 *     description: Post standup notes
 *     tags: [Standup]
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateStandupResponseReq'
 *     responses:
 *       200:
 *         description: Return the success confirmation of standup notes posted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandupResponse'
 *             examples:
 *               basic:
 *                 $ref: '#/components/examples/basic_standup_response_res'
 */
router.post(
  '/standups/complete',
  [body('standup_update').isObject(), authMiddleware],
  standUpController.completeStandUp,
);

/**
 * @openapi
 * /standups/subscribe:
 *   post:
 *     description: Subscribe to a standup
 *     tags: [Standup]
 *     requestBody:
 *       $ref: '#/components/requestBodies/StandupSubscriptionReq'
 *     responses:
 *       200:
 *         description: Return user with updated 'standups' field
 *         content:
 *           application/json:
 *             examples:
 *               basic:
 *                 $ref: '#/components/examples/standup_subscription_res'
 */
router.post(
  '/standups/subscribe',
  [body('standup_id').isString(), authMiddleware],
  standUpController.subscribeToStandUp,
);

/**
 * @openapi
 * /standups/unsubscribe:
 *   post:
 *     description: Unsubscribe to a standup
 *     tags: [Standup]
 *     requestBody:
 *       $ref: '#/components/requestBodies/StandupSubscriptionReq'
 *     responses:
 *       200:
 *         description: Return user with updated 'standups' field
 *         content:
 *           application/json:
 *             examples:
 *               basic:
 *                 $ref: '#/components/examples/standup_unsubscription_res'
 */
router.post(
  '/standups/unsubscribe',
  [body('standup_id').isString(), authMiddleware],
  standUpController.unsubscribeToStandUp,
);

/**
 * @openapi
 * /users:
 *   get:
 *     description: Get users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Return the list users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/users', authMiddleware, userController.users);
router.put('/users', authMiddleware, userController.updateUser);

// Authentication routes

/**
 * @openapi
 * /login:
 *   post:
 *     description: Login User
 *     tags: [Authentication]
 *     requestBody:
 *       $ref: '#/components/requestBodies/LoginReq'
 *     responses:
 *       200:
 *         description: Return a JWT token
 *         content:
 *           application/json:
 *             examples:
 *               basic:
 *                 value:
 *                   token: xxx
 */
router.post('/login', authenticationController.login);

/**
 * @openapi
 * /users/register:
 *   post:
 *     description: Register User
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Return a JWT token
 *         content:
 *           application/json:
 *             examples:
 *               basic:
 *                 value:
 *                   token: xxx
 */
router.post(
  '/users/register',
  [
    body('user').isObject(),
    body('user.username').isString(),
    body('user.email').isEmail(),
    body('user.password').isString(),
  ],
  authenticationController.createUser,
);

export default router;
