const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'booking', 
      'status', 
      'review', 
      'payment', 
      'payment_received',
      'payment_failed',
      'refund_processed',
      'subscription_renewal',
      'booking_reminder',
      'checkin_reminder',
      'checkout_reminder',
      'booking_confirmation',
      'password_change',
      'new_device_login',
      'security_alert',
      'promotional',
      'special_offer',
      'venue_match',
      'seasonal_promotion',
      'venue_policy_change',
      'new_amenity',
      'maintenance',
      'general'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);

