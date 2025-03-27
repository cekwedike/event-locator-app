const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Validation middleware
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes (admin only)
router.post('/', isAuthenticated, isAdmin, categoryValidation, createCategory);
router.put('/:id', isAuthenticated, isAdmin, categoryValidation, updateCategory);
router.delete('/:id', isAuthenticated, isAdmin, deleteCategory);

module.exports = router; 