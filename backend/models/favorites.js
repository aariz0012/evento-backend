const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Venue', 'Service'] // Adjust based on your models
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);
