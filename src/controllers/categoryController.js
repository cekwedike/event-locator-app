const { pool } = require('../config/database');
const logger = require('../utils/logger');

const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, description, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({ message: 'Error getting categories' });
  }
};

const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting category:', error);
    res.status(500).json({ message: 'Error getting category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), icon = COALESCE($3, icon) WHERE id = $4 RETURNING *',
      [name, description, icon, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
}; 