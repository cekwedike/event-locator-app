const amqp = require('amqplib');
const logger = require('../utils/logger');

let channel;
let connection;

const setupRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare queues
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
  try {
    await channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    logger.error('Error publishing message:', error);
    throw error;
  }
};

// Message consuming helper
const consumeMessages = async (queue, callback) => {
  try {
    await channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    logger.error('Error consuming messages:', error);
    throw error;
  }
};

// Close connection
const closeConnection = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
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