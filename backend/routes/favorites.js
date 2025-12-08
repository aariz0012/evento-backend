const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIfFavorite,
  toggleFavorite
} = require('../controllers/favorites');

/**
 * @route   GET /api/favorites
 * @desc    Get all favorites for the authenticated user
 * @access  Private
 * @query   {string} [type] - Filter by item type (Venue/Service)
 * @returns {Array} List of favorite items
 */
router.get('/', protect, getUserFavorites);

/**
 * @route   POST /api/favorites/:itemId
 * @desc    Add an item to favorites
 * @access  Private
 * @param   {string} itemId - ID of the item to favorite
 * @body    {string} type - Type of the item (Venue/Service)
 * @returns {Object} Added favorite item
 */
router.post('/:itemId', protect, addToFavorites);

/**
 * @route   DELETE /api/favorites/:itemId
 * @desc    Remove an item from favorites
 * @access  Private
 * @param   {string} itemId - ID of the item to remove
 * @returns {Object} Success message
 */
router.delete('/:itemId', protect, removeFromFavorites);

/**
 * @route   GET /api/favorites/check/:itemId
 * @desc    Check if an item is in user's favorites
 * @access  Private
 * @param   {string} itemId - ID of the item to check
 * @returns {Object} Object with isFavorite status and favoriteId if exists
 */
router.get('/check/:itemId', protect, checkIfFavorite);

/**
 * @route   POST /api/favorites/toggle/:itemId
 * @desc    Toggle favorite status of an item
 * @access  Private
 * @param   {string} itemId - ID of the item to toggle
 * @body    {string} type - Type of the item (Venue/Service)
 * @returns {Object} Object with isFavorite status and favoriteId
 */
router.post('/toggle/:itemId', protect, toggleFavorite);

module.exports = router;
