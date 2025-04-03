require('dotenv').config({ path: '.env.test' });
const { createTestDatabase } = require('../db/createTestDb');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_NAME = 'event_locator_test';
process.env.DB_PORT = '5433';

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

// Setup test database
const { pool } = require('../config/database');

// Global setup - runs once before all tests
beforeAll(async () => {
  try {
    // Create test database if it doesn't exist
    await createTestDatabase();

    // Enable PostGIS extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    
    // Drop all tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS event_notifications CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS saved_events CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location GEOGRAPHY(POINT, 4326),
        preferred_language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        category_id INTEGER,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS saved_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS event_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE,
        update_type VARCHAR(50),
        language VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id, type)
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_event_notifications_user ON event_notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON event_notifications(event_id);
    `);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

// After each test
afterEach(async () => {
  try {
    // Clean up data but keep tables
    await pool.query(`
      TRUNCATE TABLE event_notifications CASCADE;
      TRUNCATE TABLE notifications CASCADE;
      TRUNCATE TABLE saved_events CASCADE;
      TRUNCATE TABLE reviews CASCADE;
      TRUNCATE TABLE events CASCADE;
      TRUNCATE TABLE users CASCADE;
    `);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
});

// After all tests
afterAll(async () => {
  try {
    // Drop all tables
    await pool.query(`
      DROP TABLE IF EXISTS event_notifications CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS saved_events CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    await pool.end();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
});

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Export setup and cleanup functions
module.exports = {
  setupTestDatabase: async () => {
    // This function is now empty as the setup is handled by the beforeAll and afterAll hooks
  },
  cleanupTestDatabase: async () => {
    // This function is now empty as the cleanup is handled by the afterAll hook
  }
}; 