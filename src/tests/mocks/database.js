// Mock database implementation for tests
const mockPool = {
  connect: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn()
  }),
  
  query: jest.fn().mockResolvedValue({ rows: [] }),
  
  on: jest.fn(),
  
  end: jest.fn().mockResolvedValue(undefined)
};

const mockDatabase = {
  pool: mockPool,
  
  testConnection: jest.fn().mockResolvedValue(undefined),
  
  setupDatabase: jest.fn().mockResolvedValue(undefined)
};

module.exports = mockDatabase; 