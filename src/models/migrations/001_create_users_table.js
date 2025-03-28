exports.name = '001_create_users_table';

exports.up = async (db) => {
  // First create the table
  await db.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      location GEOGRAPHY(POINT),
      preferred_language VARCHAR(10) DEFAULT 'en',
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Then create the indexes separately
  await db.none('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
  
  // Create the GIST index only if the location column exists
  const locationExists = await db.oneOrNone(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'location';
  `);

  if (locationExists) {
    await db.none('CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);');
  }
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS users;');
}; 