const amqp = require('amqplib');
const logger = require('../utils/logger');

let channel = null;
let connection = null;

const connect = async () => {
  try {
    // Skip RabbitMQ setup in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.info('Skipping RabbitMQ setup in development mode');
      return;
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // Create queues
    await channel.assertQueue('event_notifications', { durable: true });
    await channel.assertQueue('email_notifications', { durable: true });
    await channel.assertQueue('push_notifications', { durable: true });

    logger.info('Successfully connected to RabbitMQ');
  } catch (error) {
    logger.error('RabbitMQ setup failed:', error);
    logger.warn('RabbitMQ connection failed - continuing without message queue functionality');
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

const close = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};

module.exports = {
  connect,
  getChannel,
  close
}; 