const amqp = require('amqplib');
const logger = require('../utils/logger');

let channel;
let connection;

const setupRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    logger.info('RabbitMQ setup completed');
  } catch (error) {
    logger.error('RabbitMQ setup failed:', error);
    throw error;
  }
};

// Message publishing helper
const publishMessage = async (queue, message) => {
  if (!channel) {
    logger.debug('RabbitMQ not connected - message not sent');
    return;
  }

  try {
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    logger.info(`Message published to ${queue}`);
  } catch (error) {
    logger.error('Error publishing message:', error);
  }
};

// Message consuming helper
const consumeMessages = async (queue, callback) => {
  if (!channel) {
    logger.debug('RabbitMQ not connected - message consumption not started');
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