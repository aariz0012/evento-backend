const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/profile';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profileImageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, authorize('user'), (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, authorize('user'), uploadProfileImage.single('profileImage'), async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Fields to update - include all profile fields
    const fieldsToUpdate = {};
    
    // Always update these fields if provided
    if (req.body.fullName !== undefined && req.body.fullName !== '') {
      fieldsToUpdate.fullName = req.body.fullName;
    }
    if (req.body.address !== undefined && req.body.address !== '') {
      fieldsToUpdate.address = req.body.address;
    }
    
    // Update additional profile fields if provided
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone || '';
    if (req.body.dateOfBirth !== undefined) fieldsToUpdate.dateOfBirth = req.body.dateOfBirth || '';
    if (req.body.gender !== undefined) fieldsToUpdate.gender = req.body.gender || '';
    if (req.body.country !== undefined) fieldsToUpdate.country = req.body.country || 'India';
    if (req.body.state !== undefined) fieldsToUpdate.state = req.body.state || '';
    if (req.body.district !== undefined) fieldsToUpdate.district = req.body.district || '';
    if (req.body.pincode !== undefined) fieldsToUpdate.pincode = req.body.pincode || '';
    
    // Handle profile image if uploaded
    if (req.file) {
      // Save the file path
      fieldsToUpdate.profilePicture = `/uploads/profile/${req.file.filename}`;
    } else if (req.body.profilePicture) {
      // If profile picture URL is provided in body
      fieldsToUpdate.profilePicture = req.body.profilePicture;
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
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
      data: user
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, authorize('user'), async (req, res) => {
  try {
    const User = require('../models/User');
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Create password change notification if user has it enabled
    try {
      const Notification = require('../models/Notifications');
      const userSettings = user.notificationSettings || {};
      
      if (userSettings.passwordChange !== false) {
        await Notification.create({
          user: user._id,
          type: 'password_change',
          title: 'Password Changed',
          message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
          read: false
        });
      }
    } catch (notifError) {
      // Don't fail the password change if notification creation fails
      console.error('Error creating password change notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;
