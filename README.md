# Event Locator App

A multi-user event locator application with geospatial features.

## Features

- User authentication and authorization
- Event creation and management
- Event search with geospatial queries
- Event categories and filtering
- User reviews and ratings
- Event saving/bookmarking
- Multi-language support
- Real-time notifications

## Tech Stack

- Node.js
- Express.js
- PostgreSQL with PostGIS
- Redis
- RabbitMQ
- Jest for testing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) with PostGIS extension
- Redis
- RabbitMQ

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
```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=event_locator
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_URL=redis://localhost:6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost

# Language Configuration
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es,fr
```

4. Set up the database:
```bash
npm run migrate
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## License

MIT 