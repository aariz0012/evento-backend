// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  updateNotificationSettings,
  markAsRead,
  markAllAsRead
} = require('../controllers/notifications');

// All routes are protected and require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', getNotifications);

// @route   PUT /api/notifications/settings
// @desc    Update notification settings
// @access  Private
router.put('/settings', updateNotificationSettings);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', markAsRead);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.patch('/mark-all-read', markAllAsRead);

module.exports = router;
