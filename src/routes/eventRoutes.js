// Event category routes
router.put('/:eventId/categories', isAuthenticated, [
  body('categoryIds')
    .isArray()
    .withMessage('categoryIds must be an array')
    .optional()
], addEventCategories);

router.get('/category/:categoryId', getEventsByCategory); 