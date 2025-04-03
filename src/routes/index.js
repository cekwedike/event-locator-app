const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const reviewRoutes = require('./reviewRoutes');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     redis:
 *                       type: string
 *                       example: connected
 *                     rabbitmq:
 *                       type: string
 *                       example: connected
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: Service unavailable
 *                 error:
 *                   type: string
 */

// Mount routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router; 