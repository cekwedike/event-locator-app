exports.name = '003_create_categories_table';

exports.up = async (db) => {
  await db.none(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
  `);

  // Insert some default categories if they don't exist
  await db.none(`
    INSERT INTO categories (name, description)
    SELECT 'Sports', 'Sports and athletic events'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sports');

    INSERT INTO categories (name, description)
    SELECT 'Music', 'Music concerts and performances'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Music');

    INSERT INTO categories (name, description)
    SELECT 'Food', 'Food festivals and culinary events'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food');

    INSERT INTO categories (name, description)
    SELECT 'Art', 'Art exhibitions and galleries'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Art');

    INSERT INTO categories (name, description)
    SELECT 'Education', 'Educational workshops and seminars'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Education');

    INSERT INTO categories (name, description)
    SELECT 'Technology', 'Tech conferences and meetups'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Technology');

    INSERT INTO categories (name, description)
    SELECT 'Social', 'Social gatherings and networking events'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Social');

    INSERT INTO categories (name, description)
    SELECT 'Business', 'Business conferences and meetings'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Business');

    INSERT INTO categories (name, description)
    SELECT 'Entertainment', 'Entertainment and recreational events'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment');

    INSERT INTO categories (name, description)
    SELECT 'Community', 'Community service and volunteer events'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Community');
  `);
};

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS categories;');
}; 