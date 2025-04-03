// Mock RabbitMQ implementation for tests
const mockRabbitMQ = {
  connection: {
    connection: {
      serverProperties: {}
    }
  },
  
  connect: async () => {
    console.log('Mock RabbitMQ connected');
    return mockRabbitMQ;
  },
  
  close: async () => {
    console.log('Mock RabbitMQ closed');
  },
  
  publishMessage: async () => {
    return true;
  },
  
  consume: async () => {
    return true;
  }
};

module.exports = mockRabbitMQ; 