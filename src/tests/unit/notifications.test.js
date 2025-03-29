const { expect, chai, createTestUser, createTestEvent, loginTestUser } = require('../setup');
const app = require('../../app');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

describe('Notification System', () => {
  let testUser;
  let authToken;
  let testEvent;

  before(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, testUser.password);
    testEvent = await createTestEvent(testUser.id);
  });

  after(async () => {
    await redis.quit();
  });

  describe('Event Notifications', () => {
    it('should subscribe to event notifications', async () => {
      const response = await chai.request(app)
        .post(`/api/events/${testEvent.id}/subscribe`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message');
    });

    it('should not subscribe to non-existent event', async () => {
      const response = await chai.request(app)
        .post('/api/events/999999/subscribe')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message');
    });

    it('should unsubscribe from event notifications', async () => {
      const response = await chai.request(app)
        .post(`/api/events/${testEvent.id}/unsubscribe`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message');
    });
  });

  describe('Notification Preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        email_notifications: true,
        push_notifications: false,
        notification_radius: 10, // km
        notification_frequency: 'daily'
      };

      const response = await chai.request(app)
        .put('/api/users/preferences/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response).to.have.status(200);
      expect(response.body.email_notifications).to.equal(preferences.email_notifications);
      expect(response.body.push_notifications).to.equal(preferences.push_notifications);
      expect(response.body.notification_radius).to.equal(preferences.notification_radius);
      expect(response.body.notification_frequency).to.equal(preferences.notification_frequency);
    });

    it('should get current notification preferences', async () => {
      const response = await chai.request(app)
        .get('/api/users/preferences/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('email_notifications');
      expect(response.body).to.have.property('push_notifications');
      expect(response.body).to.have.property('notification_radius');
      expect(response.body).to.have.property('notification_frequency');
    });
  });

  describe('Notification Queue', () => {
    it('should queue event update notification', async () => {
      // Update event to trigger notification
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      };

      const response = await chai.request(app)
        .put(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response).to.have.status(200);

      // Check Redis queue for notification
      const notification = await redis.lpop('notifications:queue');
      expect(notification).to.not.be.null;
      
      const parsedNotification = JSON.parse(notification);
      expect(parsedNotification).to.have.property('type', 'event_update');
      expect(parsedNotification).to.have.property('event_id', testEvent.id);
      expect(parsedNotification).to.have.property('user_id', testUser.id);
    });

    it('should queue event reminder notification', async () => {
      // Create an event for tomorrow
      const tomorrow = new Date(Date.now() + 86400000);
      const eventData = {
        title: `Reminder Test Event ${Date.now()}`,
        description: 'Test event for reminder',
        start_date: tomorrow,
        end_date: new Date(tomorrow.getTime() + 3600000),
        location: { type: 'Point', coordinates: [0, 0] },
        max_participants: 100,
        price: 0
      };

      const eventResponse = await chai.request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(eventResponse).to.have.status(201);

      // Subscribe to the event
      await chai.request(app)
        .post(`/api/events/${eventResponse.body.id}/subscribe`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check Redis queue for reminder notification
      const notification = await redis.lpop('notifications:queue');
      expect(notification).to.not.be.null;
      
      const parsedNotification = JSON.parse(notification);
      expect(parsedNotification).to.have.property('type', 'event_reminder');
      expect(parsedNotification).to.have.property('event_id', eventResponse.body.id);
      expect(parsedNotification).to.have.property('user_id', testUser.id);
    });
  });

  describe('Notification Processing', () => {
    it('should process queued notifications', async () => {
      // Add a test notification to the queue
      const testNotification = {
        type: 'test_notification',
        user_id: testUser.id,
        data: { message: 'Test notification' }
      };

      await redis.rpush('notifications:queue', JSON.stringify(testNotification));

      // Trigger notification processing
      const response = await chai.request(app)
        .post('/api/notifications/process')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('processed_count');
      expect(response.body.processed_count).to.be.at.least(1);
    });

    it('should handle notification processing errors gracefully', async () => {
      // Add an invalid notification to the queue
      await redis.rpush('notifications:queue', 'invalid-json');

      const response = await chai.request(app)
        .post('/api/notifications/process')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('error_count');
      expect(response.body.error_count).to.be.at.least(1);
    });
  });
}); 