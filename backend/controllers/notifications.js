const Notification = require('../models/Notifications');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this notification'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notification'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
exports.getNotificationSettings = async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get user with notification settings
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Default settings
    const defaultSettings = {
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
    };
    
    // Merge user settings with defaults (user settings take precedence)
    const settings = {
      ...defaultSettings,
      ...(user.notificationSettings || {})
    };
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
exports.updateNotificationSettings = async (req, res) => {
  try {
    const User = require('../models/User');
    
    if (!req.body.settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings are required'
      });
    }
    
    // Update user's notification settings
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: req.body.settings },
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.notificationSettings
    });
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

