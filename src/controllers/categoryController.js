const db = require('../config/database');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

// Get all categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await db.any(
      `SELECT c.*, COUNT(DISTINCT ec.event_id) as event_count
       FROM categories c
       LEFT JOIN event_categories ec ON c.id = ec.category_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    res.json({ categories });
  } catch (error) {
    console.error('Error in getCategories:', error);
    next(error);
  }
};

// Get category by ID
const getCategory = async (req, res, next) => {
  try {
    const category = await db.oneOrNone(
      `SELECT c.*, 
              COUNT(DISTINCT ec.event_id) as event_count,
              array_agg(DISTINCT e.id) as event_ids,
              array_agg(DISTINCT e.title) as event_titles
       FROM categories c
       LEFT JOIN event_categories ec ON c.id = ec.category_id
       LEFT JOIN events e ON ec.event_id = e.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.id]
    );

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({ category });
  } catch (error) {
    next(error);
  }
};

// Create new category
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const category = await db.one(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Update category
const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const category = await db.oneOrNone(
      'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, req.params.id]
    );

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const result = await db.result(
      'DELETE FROM categories WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Category not found');
    }

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
}; 