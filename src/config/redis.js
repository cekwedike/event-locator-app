const Redis = require('redis');
const logger = require('../utils/logger');

let redisClient;
let pubClient;
let subClient;

const setupRedis = async () => {
  try {
    // Create Redis client for caching
    redisClient = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    // Create separate clients for pub/sub
    pubClient = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    subClient = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    // Connect all clients
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
    ]);

    // Handle connection errors
    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    pubClient.on('error', (err) => logger.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => logger.error('Redis Sub Client Error:', err));

    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

// Cache helper functions
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
};

const setCache = async (key, value, expiration = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: expiration,
    });
  } catch (error) {
    logger.error('Error setting cache:', error);
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Error deleting cache:', error);
  }
};

// Pub/Sub helper functions
const publish = async (channel, message) => {
  try {
    await pubClient.publish(channel, JSON.stringify(message));
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

const subscribe = async (channel, callback) => {
  try {
    await subClient.subscribe(channel, (message) => {
      callback(JSON.parse(message));
    });
  } catch (error) {
    logger.error('Error subscribing to channel:', error);
  }
};

module.exports = {
  setupRedis,
  getCache,
  setCache,
  deleteCache,
  publish,
  subscribe,
  redisClient,
  pubClient,
  subClient,
}; 