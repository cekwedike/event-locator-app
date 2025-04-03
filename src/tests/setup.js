require('dotenv').config({ path: '.env.test' });
const { createTestDatabase } = require('../db/createTestDb');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Initialize test database
module.exports = async () => {
  try {
    console.log('Starting test database setup...');
    
    // Create test database if it doesn't exist
    await createTestDatabase();
    console.log('Test database created or already exists');

    // Connect to test database
    await pool.connect();
    console.log('Connected to test database');

    // Enable PostGIS extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('PostGIS extension enabled');
    
    // Drop all tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS event_notifications CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS saved_events CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS user_preferences CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Dropped existing tables');

    // Run migrations
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`Applied migration: ${file}`);
    }

    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}; 