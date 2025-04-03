// Mock Redis client
jest.mock('../config/redis', () => ({
  getClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

// Mock RabbitMQ client
jest.mock('../config/rabbitmq', () => ({
  getChannel: jest.fn(() => ({
    assertQueue: jest.fn(),
    sendToQueue: jest.fn(),
    consume: jest.fn(),
    close: jest.fn()
  }))
}));

// Set test timeout to 10 seconds
jest.setTimeout(10000); 