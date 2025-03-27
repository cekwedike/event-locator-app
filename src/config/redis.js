const Redis = require('redis');
const { REDIS_HOST, REDIS_PORT } = process.env;

const redisClient = Redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
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