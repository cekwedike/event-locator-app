const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const db = require('../config/database');
const app = require('../app');

// Configure chai
chai.use(chaiHttp);

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('Database URL is not configured. Please set DATABASE_URL or TEST_DATABASE_URL environment variable.');
}

// Global test variables
let testUser = null;
let testEvent = null;
let authToken = null;

// Helper functions
const createTestUser = async () => {
  const user = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    location: { type: 'Point', coordinates: [0, 0] }
  };
  
  const result = await db.one(
    `INSERT INTO users (email, password, first_name, last_name, role, location)
     VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326))
     RETURNING id, email, first_name, last_name`,
    [user.email, user.password, user.first_name, user.last_name, user.role, user.location.coordinates[0], user.location.coordinates[1]]
  );
  
  return { ...user, id: result.id };
};

const createTestEvent = async (userId) => {
  const event = {
    title: `Test Event ${Date.now()}`,
    description: 'Test event description',
    start_date: new Date(Date.now() + 86400000), // Tomorrow
    end_date: new Date(Date.now() + 172800000), // Day after tomorrow
    location: { type: 'Point', coordinates: [0, 0] },
    status: 'active',
    organizer_id: userId
  };
  
  const result = await db.one(
    `INSERT INTO events (title, description, start_date, end_date, location, status, organizer_id)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8)
     RETURNING id`,
    [event.title, event.description, event.start_date, event.end_date, 
     event.location.coordinates[0], event.location.coordinates[1],
     event.status, event.organizer_id]
  );
  
  return { ...event, id: result.id };
};

const loginTestUser = async (email, password) => {
  const response = await chai.request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
};

// Before all tests
before(async () => {
  // Connect to test database
  await db.connect(TEST_DATABASE_URL);
  
  // Create test user
  testUser = await createTestUser();
  
  // Create test event
  testEvent = await createTestEvent(testUser.id);
  
  // Login and get token
  authToken = await loginTestUser(testUser.email, testUser.password);
});

// After all tests
after(async () => {
  // Clean up test data
  await db.none('DELETE FROM events WHERE id = $1', [testEvent.id]);
  await db.none('DELETE FROM users WHERE id = $1', [testUser.id]);
  
  // Close database connection
  await db.end();
});

module.exports = {
  expect,
  chai,
  testUser,
  testEvent,
  authToken,
  createTestUser,
  createTestEvent,
  loginTestUser
}; 