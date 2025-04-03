require('dotenv').config({ path: '.env.test' });
const fs = require('fs');
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Redis, RabbitMQ, Database, and Logger
jest.mock('../config/redis', () => require('./mocks/redis'));
jest.mock('../config/rabbitmq', () => require('./mocks/rabbitmq'));
jest.mock('../config/database', () => require('./mocks/database'));
jest.mock('../utils/logger', () => require('./mocks/logger'));

// Initialize test database
module.exports = async () => {
  try {
    console.log('Starting test setup...');
    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
}; 