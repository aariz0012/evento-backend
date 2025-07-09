const express = require('express');
const {
  registerUser,
  registerHost,
  verifyOTP,
  loginUser,
  loginHost,
  getMe,
  logout
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');

const router = express.Router();

// User registration and login routes
router.post('/register/user', registerUser);
router.post('/register/host', registerHost);
router.post('/verify-otp', verifyOTP);
router.post('/login/user', loginUser);
router.post('/login/host', loginHost);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;
