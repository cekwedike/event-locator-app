# Event Locator Application

A multi-user event locator application that allows users to discover events based on location and preferences. Built with Node.js, Express, PostgreSQL, Redis, and RabbitMQ.

## Features

- User Management
  - Secure registration and login
  - User preferences and location settings
  - Profile management

- Event Management
  - Create, read, update, and delete events
  - Location-based event search
  - Category filtering
  - Event ratings and reviews
  - Save favorite events

- Location Services
  - Geospatial search within radius
  - Location-based event recommendations

- Internationalization
  - Support for multiple languages (English, Spanish, French)
  - Dynamic content translation

- Notification System
  - Real-time event updates
  - Upcoming event notifications
  - Customizable notification preferences

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) with PostGIS extension
- Redis (v6 or higher)
- RabbitMQ (v3.8 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/event-locator-app.git
cd event-locator-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_locator
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost

# Supported Languages
SUPPORTED_LANGUAGES=en,es,fr
DEFAULT_LANGUAGE=en
```

4. Set up the database:
```bash
# Create the database
createdb event_locator

# Enable PostGIS extension
psql -d event_locator -c "CREATE EXTENSION postgis;"
```

5. Start the services:
```bash
# Start Redis
redis-server

# Start RabbitMQ
rabbitmq-server
```

6. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Register
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "preferred_language": "en"
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Events

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Summer Festival",
  "description": "Annual summer music festival",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "start_time": "2023-07-15T18:00:00Z",
  "end_time": "2023-07-16T02:00:00Z",
  "category": "Music"
}
```

#### Search Events
```http
GET /api/events/search
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 10,
  "category": "Music",
  "start_date": "2023-07-01",
  "end_date": "2023-07-31"
}
```

#### Rate Event
```http
POST /api/events/:id/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "review": "Great event!"
}
```

## Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Utility functions
├── locales/         # Translation files
└── index.js         # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 