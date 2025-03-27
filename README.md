# Event Locator App

A multi-user event locator application that allows users to discover events based on location and preferences.

## Features

- User Management (Registration/Login)
- Event Management (CRUD operations)
- Location-Based Search
- Category Filtering
- Multilingual Support
- Notification System
- Event Ratings and Reviews
- Favorite Events
- Real-time Updates

## Tech Stack

- Node.js with Express.js
- PostgreSQL with PostGIS
- Redis for message queuing
- JWT for authentication
- i18next for internationalization
- Jest for testing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) with PostGIS extension
- Redis
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-locator-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the variables in `.env` with your configuration
- Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```
- Add the generated secret to your `.env` file as JWT_SECRET

⚠️ IMPORTANT: Never commit your actual `.env` file or any real secrets to version control!

4. Set up the database:
```bash
# Create database
createdb event_locator

# Run migrations
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## Security Best Practices

1. Environment Variables:
   - Never commit real secrets or credentials to version control
   - Use strong, randomly generated values for secrets
   - Keep your `.env` file secure and never share it
   - Use different secrets for development, staging, and production

2. Database:
   - Use strong passwords
   - Limit database user permissions
   - Keep your database connection secure

3. API Security:
   - All endpoints are protected with JWT authentication
   - Passwords are hashed using bcrypt
   - Input validation on all routes
   - Rate limiting on authentication routes

## Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Utility functions
└── app.js         # Application entry point
```

## API Documentation

The API documentation will be available at `/api-docs` when running the server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 