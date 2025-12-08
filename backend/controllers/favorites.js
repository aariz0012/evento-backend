// backend/controllers/favorites.js
const Favorite = require('../models/favorites');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
exports.getUserFavorites = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user.id };
    
    if (type) {
      query.itemType = type;
    }

    const favorites = await Favorite.find(query)
      .populate('itemDetails')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to favorites
// @route   POST /api/favorites/:itemId
// @access  Private
exports.addToFavorites = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.body;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    const existing = await Favorite.findOne({
      user: req.user.id,
      item: itemId,
      itemType: type
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing
      });
    }

    const favorite = await Favorite.create({
      user: req.user.id,
      item: itemId,
      itemType: type
    });

    await favorite.populate('itemDetails').execPopulate();

    res.status(201).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/favorites/:itemId
// @access  Private
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.body;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    const favorite = await Favorite.findOneAndDelete({
      user: req.user.id,
      item: itemId,
      itemType: type
    });

    if (!favorite) {
      throw new NotFoundError('Favorite not found');
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if item is favorited
// @route   GET /api/favorites/check/:itemId
// @access  Private
exports.checkIfFavorite = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.query;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    const isFavorite = await Favorite.isFavorite(req.user.id, itemId, type);

    res.status(200).json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite
// @route   POST /api/favorites/toggle/:itemId
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.body;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    // Find existing favorite
    const existing = await Favorite.findOne({
      user: req.user.id,
      item: itemId,
      itemType: type
    });

    let favorite;
    let isFavorite;

    if (existing) {
      // Remove from favorites
      await Favorite.findByIdAndDelete(existing._id);
      isFavorite = false;
    } else {
      // Add to favorites
      favorite = await Favorite.create({
        user: req.user.id,
        item: itemId,
        itemType: type
      });
      isFavorite = true;
    }

    // Get the item details for the response
    let itemDetails = null;
    if (isFavorite) {
      const model = mongoose.model(type);
      itemDetails = await model.findById(itemId)
        .select('name description price images location rating')
        .lean();
    }

    res.json({
      success: true,
      data: {
        isFavorite,
        favoriteId: favorite?._id,
        item: itemDetails
      }
    });
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    next(error);
  }
};
