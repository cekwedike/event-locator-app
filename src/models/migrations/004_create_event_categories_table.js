exports.name = '004_create_event_categories_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE event_categories (
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, category_id)
    );

    CREATE INDEX idx_event_categories_event ON event_categories(event_id);
    CREATE INDEX idx_event_categories_category ON event_categories(category_id);
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS event_categories;');
}; 