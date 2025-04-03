const { pool } = require('../config/database');

// Clean up data between tests
afterEach(async () => {
  try {
    // Clean up data between tests
    await pool.query(`
      TRUNCATE TABLE event_notifications CASCADE;
      TRUNCATE TABLE notifications CASCADE;
      TRUNCATE TABLE saved_events CASCADE;
      TRUNCATE TABLE reviews CASCADE;
      TRUNCATE TABLE events CASCADE;
      TRUNCATE TABLE user_preferences CASCADE;
      TRUNCATE TABLE users CASCADE;
    `);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Clean up all data after tests
    await pool.query(`
      DROP TABLE IF EXISTS event_notifications CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS saved_events CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS user_preferences CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    await pool.end();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}); 