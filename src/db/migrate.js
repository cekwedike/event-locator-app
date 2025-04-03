const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'event_locator']
    );

    // Create database if it doesn't exist
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'event_locator'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create database if it doesn't exist
    await createDatabase();

    // Connect to the database
    const db = require('./index');

    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Read all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    // Get executed migrations
    const executedMigrations = await db.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(row => row.name);

    // Execute each migration file
    for (const file of sqlFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');

        // Execute migration within a transaction
        await db.query('BEGIN');
        try {
          await db.query(sql);
          await db.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          await db.query('COMMIT');
          console.log(`Completed migration: ${file}`);
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
      }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 