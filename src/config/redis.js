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
      throw new Error('REDIS_URL environment variable is not set');
    }

    redisClient = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.ping();
    console.log('Successfully connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Redis setup failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Helper function to publish notifications
const publishNotification = async (channel, message) => {
  try {
    await redisClient.publish(channel, JSON.stringify(message));
  } catch (error) {
    console.error('Failed to publish notification:', error);
    throw error;
  }
};

module.exports = {
  setupRedis,
  getRedisClient,
  publishNotification
}; 