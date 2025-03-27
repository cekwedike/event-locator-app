const { db } = require('../config/database');
const { redisClient, publishNotification } = require('../config/redis');

class NotificationService {
  constructor() {
    this.initializeSubscribers();
  }

  initializeSubscribers() {
    // Subscribe to event updates
    redisClient.subscribe('event_updates', (message) => {
      this.handleEventUpdate(JSON.parse(message));
    });

    // Subscribe to event creation
    redisClient.subscribe('event_creation', (message) => {
      this.handleEventCreation(JSON.parse(message));
    });
  }

  async handleEventUpdate(event) {
    try {
      // Find users who have this event in their favorites
      const users = await db.any(
        `SELECT u.id, u.email, u.first_name, u.last_name, up.notification_enabled, up.email_notifications
         FROM users u
         JOIN favorite_events fe ON u.id = fe.user_id
         JOIN user_preferences up ON u.id = up.user_id
         WHERE fe.event_id = $1 AND up.notification_enabled = true`,
        [event.id]
      );

      // Send notifications to each user
      for (const user of users) {
        const notification = {
          type: 'event_update',
          userId: user.id,
          eventId: event.id,
          eventTitle: event.title,
          message: `Event "${event.title}" has been updated`,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailNotifications: user.email_notifications
        };

        await publishNotification('notifications', notification);
      }
    } catch (error) {
      console.error('Error handling event update:', error);
    }
  }

  async handleEventCreation(event) {
    try {
      // Find users whose preferences match the new event
      const users = await db.any(
        `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, up.*
         FROM users u
         JOIN user_preferences up ON u.id = up.user_id
         WHERE up.notification_enabled = true
         AND (
           -- Check if event is within user's preferred distance
           ST_DWithin(
             u.location::geography,
             ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
             up.max_distance * 1000
           )
           AND
           -- Check if event matches user's preferred categories
           EXISTS (
             SELECT 1 FROM event_categories ec
             WHERE ec.event_id = $3
             AND ec.category_id = ANY(up.preferred_categories)
           )
           AND
           -- Check if event price is within user's preferred range
           ($4::decimal IS NULL OR $4 >= up.min_price)
           AND ($4::decimal IS NULL OR $4 <= up.max_price)
         )`,
        [event.location.longitude, event.location.latitude, event.id, event.price]
      );

      // Send notifications to each user
      for (const user of users) {
        const notification = {
          type: 'new_event',
          userId: user.id,
          eventId: event.id,
          eventTitle: event.title,
          message: `New event "${event.title}" matches your preferences`,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailNotifications: user.email_notifications
        };

        await publishNotification('notifications', notification);
      }
    } catch (error) {
      console.error('Error handling event creation:', error);
    }
  }

  async sendEventReminder(eventId, hoursBefore = 24) {
    try {
      // Find users who are interested in this event
      const users = await db.any(
        `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, up.email_notifications
         FROM users u
         JOIN favorite_events fe ON u.id = fe.user_id
         JOIN user_preferences up ON u.id = up.user_id
         WHERE fe.event_id = $1
         AND up.notification_enabled = true`,
        [eventId]
      );

      const event = await db.one(
        'SELECT title, start_date FROM events WHERE id = $1',
        [eventId]
      );

      // Send reminders to each user
      for (const user of users) {
        const notification = {
          type: 'event_reminder',
          userId: user.id,
          eventId: eventId,
          eventTitle: event.title,
          startDate: event.start_date,
          hoursBefore,
          message: `Reminder: "${event.title}" starts in ${hoursBefore} hours`,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailNotifications: user.email_notifications
        };

        await publishNotification('notifications', notification);
      }
    } catch (error) {
      console.error('Error sending event reminder:', error);
    }
  }
}

module.exports = new NotificationService(); 