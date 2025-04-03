const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const setupDatabase = async () => {
  try {
    // Test the connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
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
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location GEOGRAPHY(POINT) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER REFERENCES users(id) PRIMARY KEY,
        preferred_categories VARCHAR[] DEFAULT '{}',
        notification_radius INTEGER DEFAULT 10,
        notification_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Event ratings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_ratings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      );
    `);

    // User saved events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_events (
        user_id INTEGER REFERENCES users(id),
        event_id INTEGER REFERENCES events(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, event_id)
      );
    `);

    await client.query('COMMIT');
    logger.info('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  setupDatabase,
}; 