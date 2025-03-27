exports.name = '002_create_events_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location GEOGRAPHY(POINT) NOT NULL,
      address TEXT NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      max_participants INTEGER,
      current_participants INTEGER DEFAULT 0,
      price DECIMAL(10,2),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT valid_dates CHECK (end_date > start_date),
      CONSTRAINT valid_participants CHECK (current_participants <= max_participants)
    );

    CREATE INDEX idx_events_location ON events USING GIST(location);
    CREATE INDEX idx_events_dates ON events(start_date, end_date);
    CREATE INDEX idx_events_creator ON events(created_by);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS events;');
}; 