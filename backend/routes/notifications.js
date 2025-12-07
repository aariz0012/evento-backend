const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/notifications');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notifications for current user
router.get('/', authorize('user'), getNotifications);

// Mark notification as read
router.patch('/:id/read', authorize('user'), markAsRead);

// Mark all notifications as read
router.patch('/read-all', authorize('user'), markAllAsRead);

// Delete all notifications (must come before /:id route)
router.delete('/', authorize('user'), deleteAllNotifications);

// Delete notification
router.delete('/:id', authorize('user'), deleteNotification);

// Get notification settings
router.get('/settings', authorize('user'), getNotificationSettings);

// Update notification settings
router.put('/settings', authorize('user'), updateNotificationSettings);

module.exports = router;

