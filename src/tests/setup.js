require('dotenv').config({ path: '.env.test' });

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

beforeAll(async () => {
  try {
    // Enable PostGIS extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    
    // Create test tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location GEOGRAPHY(POINT),
        preferred_language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location GEOGRAPHY(POINT) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        category_id INTEGER,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS saved_events (
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST (location);
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
    `);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Drop all tables
    await pool.query(`
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

// Global test timeout
jest.setTimeout(10000); 