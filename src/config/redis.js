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

    redisClient = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });

    await redisClient.ping();
    console.log('Successfully connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Redis setup failed:', error);
    // Don't throw the error, just return null
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
    console.error('Failed to publish notification:', error);
  }
};

module.exports = {
  setupRedis,
  getRedisClient,
  publishNotification
}; 