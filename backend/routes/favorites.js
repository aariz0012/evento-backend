const express = require('express');
const { getFavorites, toggleFavorite } = require('../controllers/favorites');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All favorites routes are protected
router.use(protect);

router.route('/')
  .get(getFavorites);

router.route('/toggle')
  .post(toggleFavorite);

module.exports = router;

