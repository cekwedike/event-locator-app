exports.name = '001_create_users_table';

exports.up = async (db) => {
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

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS users;');
}; 