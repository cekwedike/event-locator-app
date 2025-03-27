const { db } = require('../../config/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/constants');

// Create a test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    is_admin: false,
    ...userData
  };

  const user = await db.one(
    `INSERT INTO users (username, email, password, is_admin)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, is_admin`,
    [defaultUser.username, defaultUser.email, defaultUser.password, defaultUser.is_admin]
  );

  return user;
};

// Generate a JWT token for a user
const generateTestToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Create a test event
const createTestEvent = async (user, eventData = {}) => {
  const defaultEvent = {
    title: `Test Event ${Date.now()}`,
    description: 'Test event description',
    location: { longitude: -73.935242, latitude: 40.730610 },
    address: '123 Test St',
    start_date: new Date(Date.now() + 86400000), // Tomorrow
    end_date: new Date(Date.now() + 172800000), // Day after tomorrow
    max_participants: 100,
    price: 0,
    created_by: user.id,
    ...eventData
  };

  const event = await db.one(
    `INSERT INTO events (
      title, description, location, address, start_date, end_date,
      max_participants, price, created_by
    ) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      defaultEvent.title,
      defaultEvent.description,
      defaultEvent.location.longitude,
      defaultEvent.location.latitude,
      defaultEvent.address,
      defaultEvent.start_date,
      defaultEvent.end_date,
      defaultEvent.max_participants,
      defaultEvent.price,
      defaultEvent.created_by
    ]
  );

  return event;
};

// Create a test category
const createTestCategory = async (categoryData = {}) => {
  const defaultCategory = {
    name: `Test Category ${Date.now()}`,
    description: 'Test category description',
    ...categoryData
  };

  const category = await db.one(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [defaultCategory.name, defaultCategory.description]
  );

  return category;
};

// Clean up test data
const cleanupTestData = async () => {
  await db.none('DELETE FROM reviews');
  await db.none('DELETE FROM event_categories');
  await db.none('DELETE FROM events');
  await db.none('DELETE FROM categories');
  await db.none('DELETE FROM users');
};

module.exports = {
  createTestUser,
  generateTestToken,
  createTestEvent,
  createTestCategory,
  cleanupTestData
}; 