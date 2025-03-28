const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Get absolute paths for SQL files
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');
    
    console.log('Schema file path:', schemaPath);
    console.log('Seed file path:', seedPath);
    
    // Check if files exist
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at ${seedPath}`);
    }
    
    // Read SQL files
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('Executing schema SQL...');
    // Execute the entire schema SQL as one statement
    await db.none(schemaSQL);
    console.log('Schema SQL executed successfully');
    
    console.log('Executing seed SQL...');
    // Execute the entire seed SQL as one statement
    await db.none(seedSQL);
    console.log('Seed SQL executed successfully');
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

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