require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const i18nextBackend = require('i18next-node-fs-backend');
const { setupDatabase } = require('./config/database');
const { setupRedis } = require('./config/redis');
const { setupRabbitMQ } = require('./config/rabbitmq');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

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
    await setupDatabase();
    await setupRedis();
    await setupRabbitMQ();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 