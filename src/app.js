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
const routes = require('./routes');
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
app.use('/api', routes);

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
    await setupDatabase();
    await setupRedis();
    console.log('Database setup completed');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 