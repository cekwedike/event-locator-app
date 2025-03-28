const pgp = require('pg-promise')();
require('dotenv').config();

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure pg-promise with the database URL and SSL
const db = pgp({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's PostgreSQL
  }
});

// Test the connection
db.connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    throw error;
  });

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
        try {
          await db.tx(async (t) => {
            await migration.up(t);
            await t.none('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
          });
          console.log(`Migration ${migration.name} executed successfully`);
        } catch (error) {
          // If the error is about table already existing, we can ignore it
          if (error.code === '42P07') {
            console.log(`Table already exists for migration ${migration.name}, skipping...`);
            // Still mark the migration as executed
            await db.none('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
            continue;
          }
          throw error;
        }
      } else {
        console.log(`Migration ${migration.name} already executed, skipping...`);
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