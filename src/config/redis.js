const Redis = require('redis');
require('dotenv').config();

// Get Redis URL from Heroku or use local configuration
const REDIS_URL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redisClient = Redis.createClient({
  url: REDIS_URL,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

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