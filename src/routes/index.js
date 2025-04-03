const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');

/**
 * @swagger
 * /health:
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
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);

module.exports = router; 