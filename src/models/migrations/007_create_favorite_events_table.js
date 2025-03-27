exports.name = '007_create_favorite_events_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE favorite_events (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, event_id)
    );

    CREATE INDEX idx_favorite_events_user ON favorite_events(user_id);
    CREATE INDEX idx_favorite_events_event ON favorite_events(event_id);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS favorite_events;');
}; 