const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    // Check database connection
    await db.one('SELECT 1');
    
    // Check Redis if configured
    let redisStatus = { status: 'disabled', error: null };
    if (process.env.REDIS_URL) {
      try {
        const redis = require('../config/redis');
        await redis.ping();
        redisStatus.status = 'connected';
      } catch (error) {
        redisStatus.status = 'error';
        redisStatus.error = error.message;
      }
    }

    res.json({
      status: 'ok',
      database: 'connected',
      redis: redisStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 