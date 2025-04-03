require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Redis client
jest.mock('../config/redis', () => ({
  getClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

// Mock RabbitMQ
jest.mock('../config/rabbitmq', () => ({
  publishMessage: jest.fn(),
  consumeMessages: jest.fn(),
  closeConnection: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000); 