const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    type: mongoose.Schema.ObjectId,
    ref: 'Host',
    required: function() {
      return !this.isServiceOnly;
    }
  },
  services: [{
    serviceProvider: {
      type: mongoose.Schema.ObjectId,
      ref: 'Host'
    },
    serviceType: {
      type: String,
      enum: ['catering', 'decoration', 'organization'],
      required: true
    },
    details: mongoose.Schema.Types.Mixed, // Specific service details based on type
    price: Number
  }],
  isServiceOnly: {
    type: Boolean,
    default: false
  },
  eventDetails: {
    eventType: {
      type: String,
      enum: ['wedding', 'birthday', 'corporate', 'cultural', 'engagement', 'other'],
      required: true
    },
    guestCount: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    specialRequests: String
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    aadhaarNumber: {
      type: String,
      required: true
    }
  },
  amenities: [{
    name: String,
    price: Number
  }],
  payment: {
    totalAmount: {
      type: Number,
      required: true
    },
    advanceAmount: {
      type: Number,
      required: true
    },
    remainingAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'online_payment'],
      required: true
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    transactionId: String,
    paymentDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    smsSent: {
      type: Boolean,
      default: false
    },
    callMade: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent bookings more than 3 months in advance
BookingSchema.pre('save', function(next) {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  if (this.eventDetails.startDate > threeMonthsFromNow) {
    const error = new Error('Bookings can only be made up to 3 months in advance');
    return next(error);
  }
  
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
