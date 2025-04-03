const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validation');
const {
  updatePreferences,
  updateLocation,
  getProfile,
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/users/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferred_language:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *               notification_preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Not authenticated
 */
router.patch('/preferences', validate(userSchemas.updatePreferences), updatePreferences);

/**
 * @swagger
 * /api/users/location:
 *   patch:
 *     summary: Update user location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       401:
 *         description: Not authenticated
 */
router.patch('/location', validate(userSchemas.updateLocation), updateLocation);

module.exports = router; 