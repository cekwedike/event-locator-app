exports.name = '002_create_events_table';

exports.up = async (db) => {
  // First create the table
  await db.none(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location GEOGRAPHY(POINT),
      address TEXT NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      max_participants INTEGER,
      price DECIMAL(10,2),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Then create the indexes separately
  await db.none('CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);');
  await db.none('CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);');
  
  // Create the GIST index only if the location column exists
  const locationExists = await db.oneOrNone(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'location';
  `);

  if (locationExists) {
    await db.none('CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(location);');
  }
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS events;');
}; 