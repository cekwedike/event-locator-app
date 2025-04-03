const { pool } = require('../config/database');
const notificationService = require('../services/notificationService');
const bcrypt = require('bcryptjs');

describe('Notification Service Tests', () => {
  let testUser;
  let testEvent;

  beforeAll(async () => {
    try {
      // Create test user
      const passwordHash = await bcrypt.hash('testpass123', 10);
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, name, location)
         VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
         RETURNING id`,
        ['test@example.com', passwordHash, 'Test User', -73.935242, 40.730610]
      );
      testUser = rows[0];

      // Create test event
      const eventResult = await pool.query(
        `INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8)
         RETURNING id, title`,
        ['Test Event', 'Description', -73.935242, 40.730610, 
         new Date(Date.now() + 3600000), new Date(Date.now() + 7200000), 1, testUser.id]
      );
      testEvent = eventResult.rows[0];
    } catch (error) {
      console.error('Error setting up test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await pool.query('DELETE FROM event_notifications WHERE event_id = $1', [testEvent.id]);
      await pool.query('DELETE FROM events WHERE id = $1', [testEvent.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  });

  describe('checkUpcomingEvents', () => {
    it('should create notifications for upcoming events', async () => {
      await notificationService.checkUpcomingEvents();

      const { rows } = await pool.query(
        'SELECT * FROM event_notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'upcoming_event']
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].type).toBe('upcoming_event');
      expect(rows[0].title).toBe(testEvent.title);
    });

    it('should not create duplicate notifications', async () => {
      await notificationService.checkUpcomingEvents();

      const { rows } = await pool.query(
        'SELECT * FROM event_notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'upcoming_event']
      );

      expect(rows.length).toBe(1);
    });
  });

  describe('sendEventUpdateNotification', () => {
    it('should create notification for event update', async () => {
      const notification = {
        userId: testUser.id,
        eventId: testEvent.id,
        type: 'event_update',
        message: 'Event has been updated'
      };

      await notificationService.sendEventUpdateNotification(notification);

      const { rows } = await pool.query(
        'SELECT * FROM event_notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'event_update']
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].title).toBe('Event has been updated');
    });
  });

  describe('processNotification', () => {
    it('should process notification in development mode', async () => {
      const notification = {
        userId: testUser.id,
        eventId: testEvent.id,
        type: 'test_notification',
        message: 'Test notification message'
      };

      await notificationService.processNotification(notification);

      const { rows } = await pool.query(
        'SELECT * FROM event_notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'test_notification']
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].title).toBe('Test notification message');
    });
  });
}); 