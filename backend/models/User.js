const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide a mobile number'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  address: {
    type: String,
    required: [true, 'Please provide your address']
  },
  phone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
    default: ''
  },
  country: {
    type: String,
    default: 'India'
  },
  state: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  mobileVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'host'],
    default: 'user'
  },
  notificationSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      // Payment Notifications
      paymentReceived: true,
      paymentFailed: true,
      refundProcessed: true,
      subscriptionRenewal: true,
      // Booking Reminders
      upcomingBooking: true,
      checkinReminder: true,
      checkoutReminder: true,
      bookingConfirmation: true,
      bookingRequests: true,
      bookingStatus: true,
      // Account & Security
      passwordChange: true,
      newDeviceLogin: true,
      securityAlerts: true,
      // Promotional
      specialOffers: true,
      venueMatches: true,
      seasonalPromotions: true,
      // Venue Updates
      venuePolicyChanges: true,
      newAmenities: true,
      maintenanceNotifications: true,
      // Reviews
      newReviews: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
