exports.name = '003_create_categories_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_categories_name ON categories(name);
  `);

  // Insert some default categories
  await db.none(`
    INSERT INTO categories (name, description) VALUES
    ('Sports', 'Sports and athletic events'),
    ('Music', 'Music concerts and performances'),
    ('Food', 'Food festivals and culinary events'),
    ('Art', 'Art exhibitions and galleries'),
    ('Education', 'Educational workshops and seminars'),
    ('Technology', 'Tech conferences and meetups'),
    ('Social', 'Social gatherings and networking events'),
    ('Business', 'Business conferences and meetings'),
    ('Entertainment', 'Entertainment and recreational events'),
    ('Community', 'Community service and volunteer events')
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS categories;');
}; 