const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
let isConnecting = false;

const setupRedis = async () => {
  try {
    // If already connecting or connected, return existing client
    if (isConnecting || redisClient) {
      console.log('Redis connection already in progress or client exists');
      return redisClient;
    }

    const REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
      console.warn('REDIS_URL environment variable is not set, Redis functionality will be disabled');
      return null;
    }

    console.log('Attempting to connect to Redis...');
    
    // Format Redis URL properly
    let formattedUrl = REDIS_URL;
    if (!formattedUrl.startsWith('redis://')) {
      formattedUrl = `redis://${formattedUrl}`;
    }
    
    // Log Redis URL without credentials for debugging
    const maskedUrl = formattedUrl.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    console.log('Redis URL:', maskedUrl);

    // Parse Redis URL to check format
    try {
      const url = new URL(formattedUrl);
      if (!url.protocol.startsWith('redis')) {
        console.error('Invalid Redis URL protocol:', url.protocol);
        return null;
      }
    } catch (error) {
      console.error('Invalid Redis URL format:', error.message);
      return null;
    }

    isConnecting = true;
    connectionAttempts = 0;

    redisClient = new Redis(formattedUrl, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times) => {
        connectionAttempts++;
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          console.log('Max Redis connection attempts reached, giving up');
          isConnecting = false;
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 1000);
        console.log(`Retrying Redis connection in ${delay}ms (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      keepAlive: 30000,
      family: 4,
      db: 0,
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      reconnectOnError: (err) => {
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          isConnecting = false;
          return false; // Stop reconnecting
        }
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
      connectionAttempts = 0;
      isConnecting = false;
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
      isConnecting = false;
    });

    redisClient.on('end', () => {
      console.log('Redis Client Connection Ended');
      isConnecting = false;
    });

    // Test the connection with a timeout
    try {
      const pingPromise = redisClient.ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis ping timeout')), 5000);
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
      isConnecting = false;
      return null;
    }
  } catch (error) {
    console.error('Redis setup failed:', error.message);
    isConnecting = false;
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