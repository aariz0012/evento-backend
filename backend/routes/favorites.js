const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');

// @route   GET api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('item')
      .sort({ date: -1 });
    res.json(favorites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/favorites
// @desc    Add/remove favorite
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    // Check if already favorited
    let favorite = await Favorite.findOne({
      user: req.user.id,
      item: itemId,
      itemType
    });

    if (favorite) {
      // Remove from favorites
      await Favorite.findByIdAndRemove(favorite._id);
      return res.json({ msg: 'Removed from favorites' });
    }

    // Add to favorites
    favorite = new Favorite({
      user: req.user.id,
      item: itemId,
      itemType
    });

    await favorite.save();
    res.json({ msg: 'Added to favorites' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
