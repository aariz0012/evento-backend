const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HostSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Please provide your business name'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Please provide the owner name'],
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
    required: [true, 'Please provide a business contact number'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  hostType: {
    type: String,
    enum: ['venue', 'caterer', 'decorator', 'organizer'],
    required: [true, 'Please specify the host type']
  },
  address: {
    type: String,
    required: [true, 'Please provide your full address']
  },
  city: {
    type: String,
    required: [true, 'Please provide your city']
  },
  zipCode: {
    type: String,
    required: [true, 'Please provide your ZIP/Postal code']
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
  verificationDocuments: [{
    type: String // Paths to uploaded verification documents
  }],
  images: [{
    type: String, // Paths to uploaded images
    maxlength: 15 // Maximum 15 images
  }],
  videos: [{
    type: String, // Paths to uploaded videos
    maxlength: 5 // Maximum 5 videos
  }],
  // Venue specific fields
  venueType: {
    type: String,
    enum: ['lawn', 'banquet', 'cafe', 'hotel', 'resort', 'other'],
    required: function() {
      return this.hostType === 'venue';
    }
  },
  maxGuestCapacity: {
    type: Number,
    required: function() {
      return this.hostType === 'venue';
    }
  },
  // Caterer specific fields
  menuOptions: {
    vegetarian: {
      type: Boolean,
      default: function() {
        return this.hostType === 'caterer' ? true : undefined;
      }
    },
    nonVegetarian: {
      type: Boolean,
      default: function() {
        return this.hostType === 'caterer' ? false : undefined;
      }
    }
  },
  menuItems: [{
    category: String, // e.g., Starters, Main Course, Desserts
    name: String,
    description: String,
    price: Number,
    isVegetarian: Boolean
  }],
  // Decorator specific fields
  decorationCategories: [{
    name: String, // e.g., Flowers, Balloons, Themes
    description: String,
    pricePerSqFt: Number,
    packagePrice: Number
  }],
  // Organizer specific fields
  eventTypes: [{
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'cultural', 'engagement', 'other']
  }],
  organizerServices: [{
    name: String,
    description: String,
    pricePerGuest: Number
  }],
  // Common fields for all service providers
  services: [{
    type: String,
    enum: ['catering', 'decoration', 'organization', 'parking', 'music', 'photography', 'videography', 'other']
  }],
  pricing: {
    basePrice: Number,
    pricePerHour: Number,
    pricePerDay: Number,
    cleaningFee: Number,
    securityDeposit: Number
  },
  availability: [{
    date: Date,
    isAvailable: Boolean,
    timeSlots: [{
      startTime: String,
      endTime: String,
      isBooked: Boolean
    }]
  }],
  paymentMethods: {
    bankTransfer: Boolean,
    upi: Boolean,
    onlinePayment: Boolean
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  upiId: String,
  advancePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
HostSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
HostSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, isHost: true }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match host entered password to hashed password in database
HostSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Host', HostSchema);
