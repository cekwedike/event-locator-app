const amqp = require('amqplib');
const logger = require('../utils/logger');

let channel = null;
let connection = null;

const setupRabbitMQ = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.FORCE_RABBITMQ) {
    logger.info('Skipping RabbitMQ setup in development mode');
    return;
  }

  try {
    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Create queues
    await channel.assertQueue('event_notifications', { durable: true });
    await channel.assertQueue('event_updates', { durable: true });

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.info('RabbitMQ connection closed');
    });

    logger.info('RabbitMQ connected successfully');
  } catch (error) {
    logger.error('RabbitMQ connection error:', error);
    throw error;
  }
};

// Message publishing helper
const publishMessage = async (queue, message) => {
  if (!channel) {
    logger.warn('RabbitMQ not connected - message not sent');
    return;
  }

  try {
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    logger.info(`Message published to ${queue}`);
  } catch (error) {
    logger.error('Error publishing message:', error);
    throw error;
  }
};

// Message consuming helper
const consumeMessages = async (queue, callback) => {
  if (!channel) {
    logger.warn('RabbitMQ not connected - message consumption not started');
    return;
  }

  try {
    await channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        channel.ack(msg);
      }
    });
    logger.info(`Consuming messages from ${queue}`);
  } catch (error) {
    logger.error('Error consuming messages:', error);
    throw error;
  }
};

// Close connection
const closeConnection = async () => {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
};

module.exports = {
  setupRabbitMQ,
  publishMessage,
  consumeMessages,
  closeConnection,
  channel,
  connection,
}; 