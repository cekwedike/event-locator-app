const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

const connect = async () => {
  try {
    // Skip Redis setup in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.info('Skipping Redis setup in development mode');
      return;
    }

    client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    client.on('connect', () => {
      logger.info('Successfully connected to Redis');
    });

    client.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    return client;
  } catch (error) {
    logger.error('Redis setup failed:', error);
    logger.warn('Redis connection failed - continuing without caching functionality');
    return null;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

const close = async () => {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
  }
};

// Cache helper functions
const getCache = async (key) => {
  try {
    if (!client) {
      return null;
    }
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error getting from cache:', error);
    return null;
  }
};

const setCache = async (key, value, expireSeconds = 3600) => {
  try {
    if (!client) {
      return false;
    }
    await client.set(key, JSON.stringify(value), 'EX', expireSeconds);
    return true;
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    if (!client) {
      return false;
    }
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Error deleting from cache:', error);
    return false;
  }
};

// Pub/Sub helper functions
const publish = async (channel, message) => {
  if (!client) {
    return;
  }

  try {
    await client.publish(channel, JSON.stringify(message));
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

const subscribe = async (channel, callback) => {
  if (!client) {
    return;
  }

  try {
    await client.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
  } catch (error) {
    logger.error('Error subscribing to channel:', error);
  }
};

module.exports = {
  connect,
  getClient,
  close,
  getCache,
  setCache,
  deleteCache,
  publish,
  subscribe,
}; 