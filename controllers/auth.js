const User = require('../models/User');
const Host = require('../models/Host');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const crypto = require('crypto');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/register/user
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or mobile number already exists'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      mobileNumber,
      password,
      address
    });

    // Generate OTPs for verification
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    // Store OTPs in session or database
    // For simplicity, we'll use a temporary approach here
    // In production, use Redis or another session store
    req.app.locals.verificationOTPs = req.app.locals.verificationOTPs || {};
    req.app.locals.verificationOTPs[email] = {
      emailOTP,
      mobileOTP,
      userId: user._id
    };

    // Send verification email
    await sendEmail({
      email,
      subject: 'EventO - Email Verification',
      html: `
        <h1>Welcome to EventO!</h1>
        <p>Thank you for registering with us. Please use the following OTP to verify your email:</p>
        <h2>${emailOTP}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    // Send verification SMS
    await sendSMS({
      to: mobileNumber,
      body: `Your EventO verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
    });

    // Send token
    sendTokenResponse(user, 201, res, false);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Register host
// @route   POST /api/auth/register/host
// @access  Public
exports.registerHost = async (req, res) => {
  try {
    const { 
      businessName, 
      ownerName, 
      email, 
      mobileNumber, 
      password, 
      hostType,
      address,
      city,
      zipCode,
      // Additional fields based on host type
      venueType,
      maxGuestCapacity,
      services
    } = req.body;

    // Check if host already exists
    const existingHost = await Host.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    if (existingHost) {
      return res.status(400).json({
        success: false,
        error: 'Host with this email or mobile number already exists'
      });
    }

    // Create host with basic information
    const host = await Host.create({
      businessName,
      ownerName,
      email,
      mobileNumber,
      password,
      hostType,
      address,
      city,
      zipCode,
      venueType: hostType === 'venue' ? venueType : undefined,
      maxGuestCapacity: hostType === 'venue' ? maxGuestCapacity : undefined,
      services
    });

    // Generate OTPs for verification
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    // Store OTPs in session or database
    req.app.locals.verificationOTPs = req.app.locals.verificationOTPs || {};
    req.app.locals.verificationOTPs[email] = {
      emailOTP,
      mobileOTP,
      hostId: host._id
    };

    // Send verification email
    await sendEmail({
      email,
      subject: 'EventO - Host Email Verification',
      html: `
        <h1>Welcome to EventO!</h1>
        <p>Thank you for registering as a host. Please use the following OTP to verify your email:</p>
        <h2>${emailOTP}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    // Send verification SMS
    await sendSMS({
      to: mobileNumber,
      body: `Your EventO host verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
    });

    // Send token
    sendTokenResponse(host, 201, res, true);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Verify OTP (email or mobile)
// @route   POST /api/auth/verify-otp
// @access  Private
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body; // type can be 'email' or 'mobile'
    
    // Get stored OTPs
    const storedOTPs = req.app.locals.verificationOTPs && req.app.locals.verificationOTPs[email];
    
    if (!storedOTPs) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }
    
    const isValid = type === 'email' 
      ? storedOTPs.emailOTP === otp 
      : storedOTPs.mobileOTP === otp;
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }
    
    // Update user or host verification status
    if (storedOTPs.userId) {
      const user = await User.findById(storedOTPs.userId);
      
      if (type === 'email') {
        user.emailVerified = true;
      } else {
        user.mobileVerified = true;
      }
      
      // If both email and mobile are verified, set isVerified to true
      if (user.emailVerified && user.mobileVerified) {
        user.isVerified = true;
      }
      
      await user.save();
    } else if (storedOTPs.hostId) {
      const host = await Host.findById(storedOTPs.hostId);
      
      if (type === 'email') {
        host.emailVerified = true;
      } else {
        host.mobileVerified = true;
      }
      
      // If both email and mobile are verified, set isVerified to true
      if (host.emailVerified && host.mobileVerified) {
        host.isVerified = true;
      }
      
      await host.save();
    }
    
    // Clear the OTP if both verifications are done
    if (
      (type === 'email' && storedOTPs.mobileOTP === 'verified') ||
      (type === 'mobile' && storedOTPs.emailOTP === 'verified')
    ) {
      delete req.app.locals.verificationOTPs[email];
    } else {
      // Mark this verification as complete
      req.app.locals.verificationOTPs[email][`${type}OTP`] = 'verified';
    }
    
    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login/user
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Send token
    sendTokenResponse(user, 200, res, false);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Login host
// @route   POST /api/auth/login/host
// @access  Public
exports.loginHost = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for host
    const host = await Host.findOne({ email }).select('+password');

    if (!host) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await host.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Send token
    sendTokenResponse(host, 200, res, true);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get current logged in user/host
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let data;
    
    if (req.isHost) {
      data = await Host.findById(req.host.id);
    } else {
      data = await User.findById(req.user.id);
    }
    
    res.status(200).json({
      success: true,
      data,
      isHost: req.isHost
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (model, statusCode, res, isHost) => {
  // Create token
  const token = model.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      isHost
    });
};
