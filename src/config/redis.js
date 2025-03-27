const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

const setupRedis = async () => {
  try {
    if (redisClient) {
      console.log('Redis client already exists');
      return redisClient;
    }

    const REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
      console.warn('REDIS_URL environment variable is not set, Redis functionality will be disabled');
      return null;
    }

    console.log('Attempting to connect to Redis...');
    console.log('Redis URL:', REDIS_URL.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')); // Log URL without credentials

    redisClient = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000, // 10 seconds
      commandTimeout: 5000,  // 5 seconds
      keepAlive: 30000,      // 30 seconds
      family: 4,             // IPv4
      db: 0,
      lazyConnect: true,     // Don't connect immediately
      showFriendlyErrorStack: true
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      if (err.code === 'ETIMEDOUT') {
        console.error('Redis connection timed out. Please check your Redis URL and network connectivity.');
      }
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });

    redisClient.on('close', () => {
      console.log('Redis Client Connection Closed');
    });

    redisClient.on('end', () => {
      console.log('Redis Client Connection Ended');
    });

    // Test the connection
    try {
      await redisClient.ping();
      console.log('Successfully connected to Redis');
      return redisClient;
    } catch (error) {
      console.error('Failed to ping Redis:', error.message);
      return null;
    }
  } catch (error) {
    console.error('Redis setup failed:', error.message);
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    console.warn('Redis client not initialized');
    return null;
  }
  return redisClient;
};

// Helper function to publish notifications
const publishNotification = async (channel, message) => {
  try {
    if (!redisClient) {
      console.warn('Redis client not available, notification not sent');
      return;
    }
    await redisClient.publish(channel, JSON.stringify(message));
  } catch (error) {
    console.error('Failed to publish notification:', error.message);
  }
};

module.exports = {
  setupRedis,
  getRedisClient,
  publishNotification
}; 