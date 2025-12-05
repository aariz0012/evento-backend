const Notification = require('../models/Notification');
const user = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: settings },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: user.notificationSettings });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
