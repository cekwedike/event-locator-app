require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const i18nextBackend = require('i18next-node-fs-backend');
const { setupDatabase } = require('./config/database');
const { setupRedis } = require('./config/redis');
const { setupRabbitMQ } = require('./config/rabbitmq');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const swaggerSpecs = require('./config/swagger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// i18n setup
i18next
  .use(i18nextBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
    },
    fallbackLng: process.env.DEFAULT_LANGUAGE,
    preload: process.env.SUPPORTED_LANGUAGES.split(','),
    ns: ['translation'],
    defaultNS: 'translation',
  });

app.use(i18nextMiddleware.handle(i18next));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Required services
    await setupDatabase();
    await setupRedis();
    
    // Optional services
    try {
      await setupRabbitMQ();
      logger.info('RabbitMQ connected successfully');
    } catch (error) {
      logger.warn('RabbitMQ connection failed - continuing without message queue functionality');
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      const serverUrl = `http://localhost:${PORT}`;
      const apiDocsUrl = `${serverUrl}/api-docs`;
      const healthCheckUrl = `${serverUrl}/api/health`;
      
      console.log('\n🚀 Server is running!');
      console.log('----------------------------------------');
      console.log(`🌐 Server URL: ${serverUrl}`);
      console.log(`📚 API Documentation: ${apiDocsUrl}`);
      console.log(`❤️  Health Check: ${healthCheckUrl}`);
      console.log('----------------------------------------\n');
      
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API documentation available at ${apiDocsUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 