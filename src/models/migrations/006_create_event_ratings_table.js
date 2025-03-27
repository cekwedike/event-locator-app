exports.name = '006_create_event_ratings_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE event_ratings (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE INDEX idx_event_ratings_event ON event_ratings(event_id);
    CREATE INDEX idx_event_ratings_user ON event_ratings(user_id);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS event_ratings;');
}; 