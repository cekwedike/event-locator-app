const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { eventSchemas } = require('../middleware/validation');

/**
 * @swagger
 * /events/search:
 *   get:
 *     summary: Search events by location and filters
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the search center
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the search center
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: true
 *         description: Search radius in kilometers
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by event category
 *     responses:
 *       200:
 *         description: List of events matching the search criteria
 */
router.get('/search', validate(eventSchemas.search), eventController.searchEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event details
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEvent);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - latitude
 *               - longitude
 *               - start_time
 *               - end_time
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', validate(eventSchemas.create), eventController.createEvent);

/**
 * @swagger
 * /events/{id}:
 *   patch:
 *     summary: Update event details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Not authorized to update this event
 *       404:
 *         description: Event not found
 */
router.put('/:id', validate(eventSchemas.update), eventController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized to delete this event
 *       404:
 *         description: Event not found
 */
router.delete('/:id', eventController.deleteEvent);

/**
 * @swagger
 * /events/{id}/rate:
 *   post:
 *     summary: Rate an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event rated successfully
 *       400:
 *         description: Invalid rating
 *       404:
 *         description: Event not found
 */
router.post('/:id/rate', validate(eventSchemas.rate), eventController.rateEvent);

/**
 * @swagger
 * /events/{id}/save:
 *   post:
 *     summary: Save an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event saved successfully
 *       404:
 *         description: Event not found
 */
router.post('/:id/save', eventController.saveEvent);

/**
 * @swagger
 * /events/saved/list:
 *   get:
 *     summary: Get user's saved events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved events
 */
router.get('/saved/list', eventController.getSavedEvents);

module.exports = router; 