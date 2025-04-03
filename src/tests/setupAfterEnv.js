const { pool } = require('../config/database');

// Clean up data between tests
afterEach(async () => {
  try {
    // Check if tables exist before truncating
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'event_notifications',
        'notifications',
        'saved_events',
        'reviews',
        'events',
        'user_preferences',
        'users'
      )
    `);

    const existingTables = rows.map(row => row.table_name);
    
    if (existingTables.length > 0) {
      await pool.query(`
        TRUNCATE TABLE ${existingTables.join(', ')} CASCADE;
      `);
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Check if tables exist before dropping
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'event_notifications',
        'notifications',
        'saved_events',
        'reviews',
        'events',
        'user_preferences',
        'users'
      )
    `);

    const existingTables = rows.map(row => row.table_name);
    
    if (existingTables.length > 0) {
      await pool.query(`
        DROP TABLE IF EXISTS ${existingTables.join(', ')} CASCADE;
      `);
    }
    await pool.end();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}); 