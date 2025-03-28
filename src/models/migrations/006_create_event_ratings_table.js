exports.name = '006_create_event_ratings_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE IF NOT EXISTS event_ratings (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_event_ratings_event_id ON event_ratings(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_ratings_user_id ON event_ratings(user_id);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS event_ratings;');
}; 