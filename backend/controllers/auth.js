const User = require('../models/User');
const Host = require('../models/Host');
const sendTokenResponse = require('../utils/sendTokenResponse');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');

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

    // Input validation
    if (!fullName || !email || !mobileNumber || !password || !address) {
      console.error('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

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
    req.app.locals.verificationOTPs = req.app.locals.verificationOTPs || {};
    req.app.locals.verificationOTPs[email] = {
      emailOTP,
      mobileOTP,
      userId: user._id
    };

    // Send verification email (wrapped in try-catch to prevent email failure from blocking registration)
    try {
      await sendEmail({
        email,
        subject: 'Venuity - Email Verification',
        html: `
          <h1>Welcome to Venuity!</h1>
          <p>Thank you for registering with us. Please use the following OTP to verify your email:</p>
          <h2>${emailOTP}</h2>
          <p>This OTP is valid for 10 minutes.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Send verification SMS (wrapped in try-catch to prevent SMS failure from blocking registration)
    try {
      await sendSMS({
        to: mobileNumber,
        body: `Your Venuity verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
      });
    } catch (smsError) {
      console.error('Failed to send verification SMS:', smsError);
      // Continue with registration even if SMS fails
    }

    // Generate token and send response
    const token = user.getSignedJwtToken();

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or mobile number already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      venueType,
      maxGuestCapacity,
      services
    } = req.body;

    // Basic validation
    if (!businessName || !ownerName || !email || !password || !hostType || !mobileNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
         error: existingUser.email === email 
          ? 'Email already in use' 
          : 'Mobile number already in use'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      fullName: ownerName, // Using ownerName as fullName for consistency
      email,
      mobileNumber,
      password: hashedPassword,
      role: 'host',
      isHost: true,
      hostType,
      address,
      city,
      zipCode,
      isVerified: false, // Will be set to true after OTP verification
      emailVerified: false,
      mobileVerified: false
    });

    // Generate OTPs for verification
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    // Store OTPs in session
    req.app.locals.verificationOTPs = req.app.locals.verificationOTPs || {};
    req.app.locals.verificationOTPs[email] = {
      emailOTP,
      mobileOTP,
      userId: user._id
    };

    // Save user to database
    await user.save();

    // Create host-specific document
    const host = new Host({
      user: user._id,
      businessName,
      ownerName,
      email,
      mobileNumber,
      hostType,
      address,
      city,
      zipCode,
      venueType: hostType === 'venue' ? venueType : undefined,
      maxGuestCapacity: hostType === 'venue' ? maxGuestCapacity : undefined,
      services: services || [],
      rating: 1, // Start with 0 rating
      isVerified: false
    });

    await host.save();

    // Send verification email
    await sendEmail({
      email,
      subject: 'Venuity - Host Registration',
      html: `
        <h1>Welcome to Venuity as a Host!</h1>
        <p>Thank you for registering as a host. Please use the following OTP to verify your email:</p>
        <h2>${emailOTP}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    // Send verification SMS
    await sendSMS({
      to: mobileNumber,
      body: `Your Venuity host verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Send token response
    sendTokenResponse(user, 201, res, true);

     res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Host registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

       // Validate input
       if (!email || !password) {
         return res.status(400).json({
           success: false,
           error: 'Please provide an email and password'
         });
       }

       // Check if user exists
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

       // Generate token
       const token = user.getSignedJwtToken();

       // Send response
       res.status(200).json({
         success: true,
         token,
         user: {
           id: user._id,
           email: user.email,
           role: user.role
         }
       });
     } catch (error) {
       console.error('Login error:', error);
       res.status(500).json({
         success: false,
         error: 'Server error'
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

