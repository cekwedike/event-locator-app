const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { eventSchemas, ratingSchema } = require('../middleware/validation');
const {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  rateEvent,
  saveEvent,
  getSavedEvents,
} = require('../controllers/eventController');

const router = express.Router();

// Public routes
router.get('/search', validate(eventSchemas.search), searchEvents);
router.get('/:id', getEvent);

// Protected routes
router.use(auth);
router.post('/', validate(eventSchemas.create), createEvent);
router.patch('/:id', validate(eventSchemas.update), updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/rate', validate(ratingSchema), rateEvent);
router.post('/:id/save', saveEvent);
router.get('/saved/events', getSavedEvents);

module.exports = router; 