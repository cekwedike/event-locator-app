require('dotenv').config();
const express = require('express');
const cors = require('cors');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const passport = require('passport');
const { errorHandler } = require('./middleware/errorHandler');
const { setupDatabase } = require('./config/database');
const { setupRedis } = require('./config/redis');
const { setupI18n } = require('./config/i18n');
const { setupPassport } = require('./config/passport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Setup i18n
setupI18n();
app.use(i18nextMiddleware.handle(i18next));

// Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));

// Error handling
app.use(errorHandler);

// Database and Redis setup
const startServer = async () => {
  try {
    await setupDatabase();
    await setupRedis();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 