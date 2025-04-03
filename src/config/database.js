require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to database');
    client.release();
  } catch (err) {
    logger.error('Error connecting to the database:', err);
    // Don't throw the error, just log it
    // This allows the application to start even if the database is not available
  }
};

// Call testConnection immediately
testConnection();

pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
async function setupDatabase() {
  const client = await pool.connect();
  try {
    // Test basic connection
    await client.query('SELECT NOW()');
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
  setupDatabase
}; 