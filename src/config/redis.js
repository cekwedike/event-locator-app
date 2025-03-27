const Redis = require('redis');
require('dotenv').config();

// Get Redis URL from environment
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not set');
}

const redisClient = Redis.createClient({
  url: REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('Successfully connected to Redis');
  })
  .catch((error) => {
    console.error('Failed to connect to Redis:', error);
    throw error;
  });

const setupRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection successful');

    // Subscribe to notification channel
    const subscriber = redisClient.duplicate();
    await subscriber.subscribe('notifications', (message) => {
      console.log('Received notification:', message);
      // Handle notification (to be implemented)
    });
  } catch (error) {
    console.error('Redis setup failed:', error);
    throw error;
  }
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
  redisClient,
  setupRedis,
  publishNotification
}; 