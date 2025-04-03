const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);

module.exports = router; 