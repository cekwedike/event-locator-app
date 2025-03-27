exports.name = '005_create_user_preferences_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE user_preferences (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
      preferred_categories INTEGER[],
      max_distance INTEGER DEFAULT 50, -- in kilometers
      min_price DECIMAL(10,2),
      max_price DECIMAL(10,2),
      notification_enabled BOOLEAN DEFAULT TRUE,
      email_notifications BOOLEAN DEFAULT TRUE,
      push_notifications BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT valid_price_range CHECK (max_price >= min_price)
    );

    CREATE INDEX idx_user_preferences_categories ON user_preferences USING GIN(preferred_categories);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS user_preferences;');
}; 