const { pool } = require('../config/database');
const { publishMessage } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const checkUpcomingEvents = async () => {
  try {
    // Get events starting in the next 24 hours
    const { rows: events } = await pool.query(
      `SELECT e.id, e.title, e.start_time, e.category,
              ST_X(e.location::geometry) as longitude,
              ST_Y(e.location::geometry) as latitude
       FROM events e
       WHERE e.start_time BETWEEN NOW() AND NOW() + INTERVAL '24 hours'`
    );

    for (const event of events) {
      // Get users who might be interested in this event
      const { rows: users } = await pool.query(
        `SELECT u.id, u.email, u.name, u.preferred_language,
                ST_X(u.location::geometry) as longitude,
                ST_Y(u.location::geometry) as latitude,
                up.notification_radius, up.notification_enabled
         FROM users u
         JOIN user_preferences up ON u.id = up.user_id
         WHERE up.notification_enabled = true
         AND (
           up.preferred_categories @> ARRAY[$1]::varchar[]
           OR up.preferred_categories = '{}'
         )
         AND ST_DWithin(
           u.location::geography,
           ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           up.notification_radius * 1000
         )`,
        [event.category, event.longitude, event.latitude]
      );

      // Send notifications to interested users
      for (const user of users) {
        await publishMessage('event_notifications', {
          userId: user.id,
          eventId: event.id,
          type: 'upcoming_event',
          data: {
            eventTitle: event.title,
            startTime: event.start_time,
            userEmail: user.email,
            userName: user.name,
            preferredLanguage: user.preferred_language,
          },
        });
      }
    }
  } catch (error) {
    logger.error('Error checking upcoming events:', error);
  }
};

const sendEventUpdateNotification = async (eventId, userId, updateType) => {
  try {
    // Get event details
    const { rows: events } = await pool.query(
      `SELECT e.title, e.start_time, e.category,
              ST_X(e.location::geometry) as longitude,
              ST_Y(e.location::geometry) as latitude
       FROM events e
       WHERE e.id = $1`,
      [eventId]
    );

    if (events.length === 0) return;

    const event = events[0];

    // Get users who have saved this event
    const { rows: users } = await pool.query(
      `SELECT u.id, u.email, u.name, u.preferred_language
       FROM saved_events se
       JOIN users u ON se.user_id = u.id
       WHERE se.event_id = $1
       AND u.id != $2`,
      [eventId, userId]
    );

    // Send notifications to users who saved the event
    for (const user of users) {
      await publishMessage('event_notifications', {
        userId: user.id,
        eventId,
        type: `event_${updateType}`,
        data: {
          eventTitle: event.title,
          startTime: event.start_time,
          userEmail: user.email,
          userName: user.name,
          preferredLanguage: user.preferred_language,
        },
      });
    }
  } catch (error) {
    logger.error('Error sending event update notification:', error);
  }
};

const processNotification = async (notification) => {
  try {
    const { userId, eventId, type, data } = notification;

    // Get user's notification preferences
    const { rows } = await pool.query(
      `SELECT u.email, u.preferred_language, up.notification_enabled
       FROM users u
       JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (rows.length === 0 || !rows[0].notification_enabled) return;

    const user = rows[0];

    // Here you would implement the actual notification sending logic
    // This could be email, push notification, SMS, etc.
    logger.info('Sending notification:', {
      userId,
      eventId,
      type,
      userEmail: user.email,
      preferredLanguage: user.preferred_language,
      ...data,
    });

    // Example email sending (implement your email service)
    // await sendEmail({
    //   to: user.email,
    //   subject: getNotificationSubject(type, data, user.preferred_language),
    //   text: getNotificationText(type, data, user.preferred_language),
    // });
  } catch (error) {
    logger.error('Error processing notification:', error);
  }
};

module.exports = {
  checkUpcomingEvents,
  sendEventUpdateNotification,
  processNotification,
}; 