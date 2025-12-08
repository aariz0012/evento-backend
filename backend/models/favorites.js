const mongoose = require('mongoose');

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
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster queries when checking if an item is favorited
favoriteSchema.index({ user: 1, item: 1, itemType: 1 }, { unique: true });

// Index for getting favorites by user and type
favoriteSchema.index({ user: 1, itemType: 1, date: -1 });

// Virtual for populating the item based on itemType
favoriteSchema.virtual('itemDetails', {
  ref: doc => doc.itemType,
  localField: 'item',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to ensure data consistency
favoriteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.date = new Date();
  }
  next();
});

// Static method to check if a user has favorited an item
favoriteSchema.statics.isFavorite = async function(userId, itemId, itemType) {
  return await this.exists({ user: userId, item: itemId, itemType });
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
