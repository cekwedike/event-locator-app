const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const COMMAND_TIMEOUT = 10000; // 10 seconds

const setupRedis = async () => {
  const REDIS_URL = process.env.REDIS_URL;
  
  if (!REDIS_URL) {
    console.log('No Redis URL provided, Redis will be disabled');
    return null;
  }

  console.log('Attempting to connect to Redis...');
  console.log('Redis URL:', REDIS_URL);

  return new Promise((resolve, reject) => {
    try {
      redisClient = new Redis(REDIS_URL, {
        connectTimeout: CONNECTION_TIMEOUT,
        commandTimeout: COMMAND_TIMEOUT,
        retryStrategy: (times) => {
          if (times > MAX_CONNECTION_ATTEMPTS) {
            console.log('Max Redis connection attempts reached');
            return null;
          }
          const delay = Math.min(times * 1000, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        lazyConnect: false
      });

      redisClient.on('connect', () => {
        console.log('Successfully connected to Redis');
        connectionAttempts = 0;
        resolve(redisClient);
      });

      redisClient.on('error', (error) => {
        console.error('Redis connection error:', error.message);
        if (error.code === 'ETIMEDOUT') {
          console.log('Redis connection timeout, will retry...');
        } else if (error.code === 'ECONNREFUSED') {
          console.log('Redis connection refused, will retry...');
        }
      });

      redisClient.on('close', () => {
        console.log('Redis connection closed');
      });

      redisClient.on('reconnecting', () => {
        console.log('Reconnecting to Redis...');
      });

      // Test the connection
      redisClient.ping().then(() => {
        console.log('Redis ping successful');
      }).catch((error) => {
        console.error('Redis ping failed:', error.message);
      });

    } catch (error) {
      console.error('Failed to create Redis client:', error.message);
      reject(error);
    }
  });
};

const getRedisClient = () => {
  return redisClient;
};

// Helper function to publish notifications
const publishNotification = async (channel, message) => {
  try {
    if (!redisClient) {
      console.warn('Redis client not available, notification not sent');
      return;
    }
    await redisClient.ping(); // Check connection before publishing
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