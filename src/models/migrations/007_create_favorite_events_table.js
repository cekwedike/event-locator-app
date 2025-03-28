exports.name = '007_create_favorite_events_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE IF NOT EXISTS favorite_events (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, event_id)
    );

    CREATE INDEX IF NOT EXISTS idx_favorite_events_user_id ON favorite_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorite_events_event_id ON favorite_events(event_id);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS favorite_events;');
}; 