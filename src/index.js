require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { pool, setupDatabase } = require('./config/database');
const logger = require('./utils/logger');
const redis = require('./config/redis');
const rabbitmq = require('./config/rabbitmq');

// Import routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Event Locator API',
    documentation: '/api-docs',
    health: '/api/health',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await pool.query('SELECT NOW()');
    
    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      if (redis.status === 'ready') {
        redisStatus = 'connected';
      }
    } catch (error) {
      logger.warn('Redis health check failed:', error);
    }

    // Check RabbitMQ connection
    let rabbitmqStatus = 'disconnected';
    try {
      if (rabbitmq.connection && rabbitmq.connection.connection.serverProperties) {
        rabbitmqStatus = 'connected';
      }
    } catch (error) {
      logger.warn('RabbitMQ health check failed:', error);
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus.rows ? 'connected' : 'disconnected',
        redis: redisStatus,
        rabbitmq: rabbitmqStatus
      },
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Service unavailable',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database
    await setupDatabase();
    logger.info('Database initialized successfully');

    // Connect to services
    await redis.connect();
    await rabbitmq.connect();

    app.listen(PORT, () => {
      console.log('\n🚀 Server is running!');
      console.log('----------------------------------------');
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log('----------------------------------------\n');
      
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Don't exit the process in development
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

startServer(); 