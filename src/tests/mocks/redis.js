// Mock Redis implementation for tests
const mockRedis = {
  client: null,
  status: 'ready',
  
  connect: async () => {
    console.log('Mock Redis connected');
    return mockRedis;
  },
  
  getClient: () => {
    return mockRedis;
  },
  
  close: async () => {
    console.log('Mock Redis closed');
  },
  
  getCache: async () => {
    return null;
  },
  
  setCache: async () => {
    return true;
  },
  
  deleteCache: async () => {
    return true;
  },
  
  publish: async () => {
    return true;
  },
  
  subscribe: async () => {
    return true;
  }
};

module.exports = mockRedis; 