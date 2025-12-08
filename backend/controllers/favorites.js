const Favorite = require('../models/favorites');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get all favorites for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.getUserFavorites = async (req, res, next) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;

    const query = { user: userId };
    if (type && ['Venue', 'Service'].includes(type)) {
      query.itemType = type;
    }

    const favorites = await Favorite.find(query)
      .populate('itemDetails')
      .sort('-date')
      .lean();

    // Transform the data for the frontend
    const formattedFavorites = favorites
      .filter(fav => fav.itemDetails) // Filter out any null references
      .map(fav => ({
        id: fav._id,
        item: {
          ...fav.itemDetails,
          _id: fav.itemDetails._id,
          type: fav.itemType
        },
        date: fav.date
      }));

    res.json({
      success: true,
      count: formattedFavorites.length,
      data: formattedFavorites
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an item to favorites
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.addToFavorites = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    if (!['Venue', 'Service'].includes(type)) {
      throw new BadRequestError('Invalid item type. Must be "Venue" or "Service"');
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      user: userId,
      item: itemId,
      itemType: type
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Item already in favorites',
        data: existing
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      item: itemId,
      itemType: type
    });

    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('itemDetails')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: {
        ...populatedFavorite,
        item: {
          ...populatedFavorite.itemDetails,
          _id: populatedFavorite.itemDetails._id,
          type: populatedFavorite.itemType
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from favorites
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      item: itemId
    });

    if (!favorite) {
      throw new NotFoundError('Favorite not found');
    }

    res.json({
      success: true,
      message: 'Removed from favorites',
      data: { itemId }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if an item is in user's favorites
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.checkIfFavorite = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({
      user: userId,
      item: itemId
    }).lean();

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite?._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle favorite status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    if (!itemId || !type) {
      throw new BadRequestError('Item ID and type are required');
    }

    // Find existing favorite
    const existing = await Favorite.findOne({
      user: userId,
      item: itemId
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
        user: userId,
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
