require('dotenv').config();
const express = require('express');
const cors = require('cors');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const passport = require('passport');
const { errorHandler } = require('./middleware/errorHandler');
const { setupRedis } = require('./config/redis');
const { setupI18n } = require('./config/i18n');
const { setupPassport } = require('./config/passport');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
const setupDatabase = require('./db/setup');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Setup i18n
i18next
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en'],
    resources: {
      en: {
        translation: {
          // Add your translations here
        }
      }
    }
  });
app.use(i18nextMiddleware.handle(i18next));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database and Redis setup
const startServer = async () => {
  try {
    // Setup database first
    await setupDatabase();
    console.log('Database setup completed');
    
    // Setup Redis (but don't fail if it fails)
    let redisStatus = 'disabled';
    let redisError = null;
    
    try {
      const redisClient = await setupRedis();
      if (redisClient) {
        redisStatus = 'connected';
        console.log('Redis setup completed');
      } else {
        redisStatus = 'failed';
        redisError = 'Redis connection failed';
        console.warn('Redis setup failed, continuing without Redis');
      }
    } catch (error) {
      redisStatus = 'error';
      redisError = error.message;
      console.warn('Redis setup failed, continuing without Redis:', error.message);
    }
    
    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        database: 'connected',
        redis: {
          status: redisStatus,
          error: redisError
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      if (redisStatus !== 'connected') {
        console.log('Note: Redis is not connected. Some features may be limited.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app; 