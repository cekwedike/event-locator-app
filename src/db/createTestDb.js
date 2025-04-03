require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');

async function createTestDatabase() {
  // Connect to the default 'postgres' database first
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Connected to postgres database');

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (checkDb.rows.length === 0) {
      // Create the test database if it doesn't exist
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Test database ${process.env.DB_NAME} created successfully`);
    } else {
      console.log(`Test database ${process.env.DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestDatabase()
    .then(() => console.log('Done'))
    .catch((error) => {
      console.error('Failed to create test database:', error);
      process.exit(1);
    });
}

module.exports = { createTestDatabase }; 