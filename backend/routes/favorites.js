const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');

// @route   GET api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching favorites for user:', req.user.id);
    
    // First, get all favorites for the user
    const favorites = await Favorite.find({ user: req.user.id })
      .sort({ date: -1 });

    if (!favorites || favorites.length === 0) {
      console.log('No favorites found for user:', req.user.id);
      return res.json([]);
    }

    // Group favorites by itemType to make population more efficient
    const favoritesByType = {};
    favorites.forEach(fav => {
      if (!favoritesByType[fav.itemType]) {
        favoritesByType[fav.itemType] = [];
      }
      favoritesByType[fav.itemType].push(fav);
    });

    // Process each item type
    const populatedFavorites = [];
    
    for (const [itemType, typeFavorites] of Object.entries(favoritesByType)) {
      const itemIds = typeFavorites.map(f => f.item);
      
      try {
        // Dynamically get the model based on itemType
        const model = mongoose.model(itemType);
        
        // Find all items of this type
        const items = await model.find({
          _id: { $in: itemIds }
        }).select('name description price images location rating');

        // Create a map for quick lookup
        const itemsMap = new Map(items.map(item => [item._id.toString(), item]));

        // Match items with their favorites
        for (const fav of typeFavorites) {
          const item = itemsMap.get(fav.item.toString());
          if (item) {
            populatedFavorites.push({
              ...item._doc,
              _id: fav._id, // Keep the favorite ID
              isFavorited: true,
              type: fav.itemType,
              favoriteId: fav._id // Add favoriteId for easy reference
            });
          }
        }
      } catch (err) {
        console.error(`Error processing ${itemType}:`, err);
        // Continue with other item types even if one fails
        continue;
      }
    }

    console.log(`Returning ${populatedFavorites.length} favorites for user:`, req.user.id);
    res.json(populatedFavorites);
  } catch (err) {
    console.error('Error in GET /api/favorites:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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
