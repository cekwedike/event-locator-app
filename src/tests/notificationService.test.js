const { pool } = require('../config/database');
const notificationService = require('../services/notificationService');
const bcrypt = require('bcryptjs');

describe('Notification Service Tests', () => {
  let testUser;
  let testEvent;

  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('testpass123', 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, location) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)) RETURNING id',
      ['test@example.com', passwordHash, 'Test User', -73.935242, 40.730610]
    );
    testUser = result.rows[0];

    // Create test event
    const eventResult = await pool.query(
      'INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8) RETURNING id',
      ['Test Event', 'Description', -73.935242, 40.730610, new Date(Date.now() + 3600000), new Date(Date.now() + 7200000), 1, testUser.id]
    );
    testEvent = eventResult.rows[0];
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM events WHERE id = $1', [testEvent.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
  });

  describe('checkUpcomingEvents', () => {
    it('should create notifications for upcoming events', async () => {
      await notificationService.checkUpcomingEvents();

      const { rows } = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND event_id = $2',
        [testUser.id, testEvent.id]
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].type).toBe('upcoming_event');
      expect(rows[0].is_read).toBe(false);
    });

    it('should not create duplicate notifications', async () => {
      await notificationService.checkUpcomingEvents();

      const { rows } = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND event_id = $2',
        [testUser.id, testEvent.id]
      );

      const uniqueNotifications = new Set(rows.map(r => r.id));
      expect(rows.length).toBe(uniqueNotifications.size);
    });
  });

  describe('sendEventUpdateNotification', () => {
    it('should create notification for event update', async () => {
      await notificationService.sendEventUpdateNotification(testEvent.id);

      const { rows } = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'event_update']
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].type).toBe('event_update');
      expect(rows[0].is_read).toBe(false);
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
        'SELECT * FROM notifications WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [testUser.id, testEvent.id, 'test_notification']
      );

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].message).toBe('Test notification message');
    });
  });
}); 