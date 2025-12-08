// backend/models/favorites.js
const mongoose = require('mongoose');
const { BadRequestError } = require('../utils/errors');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Item ID is required'],
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: [true, 'Item type is required'],
    enum: {
      values: ['Venue', 'Service'],
      message: 'Item type must be either "Venue" or "Service"'
    },
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure a user can only favorite an item once
favoriteSchema.index({ user: 1, item: 1, itemType: 1 }, { unique: true });

// Virtual for populating the item details
favoriteSchema.virtual('itemDetails', {
  ref: doc => doc.itemType,
  localField: 'item',
  foreignField: '_id',
  justOne: true
});

// Static method to check if an item is favorited
favoriteSchema.statics.isFavorite = async function(userId, itemId, itemType) {
  if (!userId || !itemId || !itemType) {
    throw new BadRequestError('User ID, Item ID, and Item Type are required');
  }
  const count = await this.countDocuments({ user: userId, item: itemId, itemType });
  return count > 0;
};

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;
