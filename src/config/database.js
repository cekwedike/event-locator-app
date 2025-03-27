const pgp = require('pg-promise')();
require('dotenv').config();

// Get database URL from Heroku or use local configuration
const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Configure pg-promise with the database URL
const db = pgp(DATABASE_URL);

const setupDatabase = async () => {
  try {
    // Test database connection
    await db.one('SELECT NOW()');
    console.log('Database connection successful');

    // Enable PostGIS extension if not already enabled
    await db.none('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('PostGIS extension enabled');

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    // Create migrations table if it doesn't exist
    await db.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const executedMigrations = await db.any('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    const migrations = [
      require('../models/migrations/001_create_users_table'),
      require('../models/migrations/002_create_events_table'),
      require('../models/migrations/003_create_categories_table'),
      require('../models/migrations/004_create_event_categories_table'),
      require('../models/migrations/005_create_user_preferences_table'),
      require('../models/migrations/006_create_event_ratings_table'),
      require('../models/migrations/007_create_favorite_events_table')
    ];

    for (const migration of migrations) {
      if (!executedMigrationNames.includes(migration.name)) {
        await db.tx(async (t) => {
          await migration.up(t);
          await t.none('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
        });
        console.log(`Migration ${migration.name} executed successfully`);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = {
  db,
  setupDatabase
}; 