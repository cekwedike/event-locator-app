const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
  try {
    // Get absolute paths
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    console.log('Current directory:', __dirname);
    console.log('Schema file path:', schemaPath);
    console.log('Seed file path:', seedPath);

    // Check if files exist
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at ${seedPath}`);
    }

    // Read and execute schema.sql
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schemaSQL);
    console.log('Schema created successfully');

    // Read and execute seed.sql
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    await db.query(seedSQL);
    console.log('Seed data inserted successfully');

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 