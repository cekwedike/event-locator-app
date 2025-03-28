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
    // Log Redis URL without credentials for debugging
    const maskedUrl = REDIS_URL.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('Redis URL:', maskedUrl);

    // Parse Redis URL to check format
    try {
      const url = new URL(REDIS_URL);
      if (!url.protocol.startsWith('redis')) {
        console.error('Invalid Redis URL protocol:', url.protocol);
        return null;
      }
    } catch (error) {
      console.error('Invalid Redis URL format:', error.message);
      return null;
    }

    redisClient = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000); // Increased delay
        console.log(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 5, // Increased retries
      connectTimeout: 20000,    // Increased timeout to 20 seconds
      commandTimeout: 10000,    // Increased command timeout to 10 seconds
      keepAlive: 30000,        // 30 seconds
      family: 4,               // IPv4
      db: 0,
      lazyConnect: true,       // Don't connect immediately
      showFriendlyErrorStack: true,
      enableOfflineQueue: false, // Disable offline queue to prevent hanging
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    // Set up event handlers
    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      if (err.code === 'ETIMEDOUT') {
        console.error('Redis connection timed out. Please check your Redis URL and network connectivity.');
      } else if (err.code === 'ECONNREFUSED') {
        console.error('Redis connection refused. Please check if Redis server is running and accessible.');
      } else if (err.code === 'ENOTFOUND') {
        console.error('Redis host not found. Please check your Redis URL.');
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

    // Test the connection with a timeout
    try {
      const pingPromise = redisClient.ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis ping timeout')), 10000);
      });

      await Promise.race([pingPromise, timeoutPromise]);
      console.log('Successfully connected to Redis');
      return redisClient;
    } catch (error) {
      console.error('Failed to ping Redis:', error.message);
      if (redisClient) {
        try {
          await redisClient.quit();
        } catch (quitError) {
          console.error('Error while closing Redis connection:', quitError.message);
        }
      }
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