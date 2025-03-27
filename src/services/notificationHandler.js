const nodemailer = require('nodemailer');
const { redisClient } = require('../config/redis');

class NotificationHandler {
  constructor() {
    this.initializeSubscriber();
    this.setupEmailTransporter();
  }

  initializeSubscriber() {
    redisClient.subscribe('notifications', async (message) => {
      try {
        const notification = JSON.parse(message);
        await this.handleNotification(notification);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    });
  }

  setupEmailTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async handleNotification(notification) {
    try {
      switch (notification.type) {
        case 'event_update':
        case 'new_event':
        case 'event_reminder':
          if (notification.emailNotifications) {
            await this.sendEmail(notification);
          }
          break;
        default:
          console.warn(`Unknown notification type: ${notification.type}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  async sendEmail(notification) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: notification.email,
        subject: this.getEmailSubject(notification),
        html: this.getEmailTemplate(notification)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${notification.email}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  getEmailSubject(notification) {
    switch (notification.type) {
      case 'event_update':
        return `Update: ${notification.eventTitle}`;
      case 'new_event':
        return `New Event: ${notification.eventTitle}`;
      case 'event_reminder':
        return `Reminder: ${notification.eventTitle} starts soon`;
      default:
        return 'Event Locator Notification';
    }
  }

  getEmailTemplate(notification) {
    const { firstName, lastName, eventTitle, message, type } = notification;
    const eventUrl = `${process.env.APP_URL}/events/${notification.eventId}`;

    let template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${firstName} ${lastName},</h2>
        <p>${message}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin: 0;">${eventTitle}</h3>
          <p style="margin: 10px 0;">
            <a href="${eventUrl}" style="color: #007bff; text-decoration: none;">View Event Details</a>
          </p>
        </div>
    `;

    if (type === 'event_reminder') {
      template += `
        <p>Event starts: ${new Date(notification.startDate).toLocaleString()}</p>
        <p>Time until event: ${notification.hoursBefore} hours</p>
      `;
    }

    template += `
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          You received this email because you have email notifications enabled in your preferences.
          To manage your notification settings, visit your profile page.
        </p>
      </div>
    `;

    return template;
  }
}

module.exports = new NotificationHandler(); 