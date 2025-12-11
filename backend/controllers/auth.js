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
      subject: 'Venuity - Email Verification',
      html: `
        <h1>Welcome to Venuity!</h1>
        <p>Thank you for registering with us. Please use the following OTP to verify your email:</p>
        <h2>${emailOTP}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    // Send verification SMS
    await sendSMS({
      to: mobileNumber,
      body: `Your Venuity verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
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

    // Check if user or host already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    const existingHost = await Host.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    if (existingUser || existingHost) {
      const errorMsg = (existingUser?.email === email || existingHost?.email === email)
        ? 'Email already in use' 
        : 'Mobile number already in use';
      return res.status(400).json({ 
        success: false, 
        error: errorMsg
      });
    }

    // Hash password separately for User
    const userHashedPassword = await bcrypt.hash(password, 10);

    // Create new user (user hash)
    const user = new User({
      fullName: ownerName, // Using ownerName as fullName for consistency
      email,
      mobileNumber,
      password: userHashedPassword,
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

    // Create host-specific document with its own password (plain); pre-save hook will hash separately
    const host = new Host({
      user: user._id,
      businessName,
      ownerName,
      email,
      mobileNumber,
      password, // plain password; Host pre-save hook will hash independently
      hostType,
      address,
      city,
      zipCode,
      venueType: hostType === 'venue' ? venueType : undefined,
      maxGuestCapacity: hostType === 'venue' ? maxGuestCapacity : undefined,
      services: services || [],
      rating: 0,
      isVerified: false
    });
    await host.save();

    // Send verification email (don't fail registration if email fails)
    try {
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
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Send verification SMS (don't fail registration if SMS fails)
    try {
      await sendSMS({
        to: mobileNumber,
        body: `Your Venuity host verification code is: ${mobileOTP}. This code is valid for 10 minutes.`
      });
    } catch (smsError) {
      console.error('Failed to send verification SMS:', smsError);
      // Continue with registration even if SMS fails
    }

    // Generate JWT token using host token method
    const token = host.getSignedJwtToken();

    // Send token response with host data
    sendTokenResponse(host, 201, res, true);
  } catch (error) {
    console.error('Host registration error:', error);
    console.error('Error stack:', error.stack);
    
    // If it's a validation error, return more specific message
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errorMessages.join(', ')
      });
    }
    
    // If it's a duplicate key error (email or mobile already exists)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already in use`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server Error. Please try again later.',
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
      console.error('Login failed: Host not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('Host found:', {
      email: host.email,
      hasPassword: !!host.password,
      hasUserLink: !!host.user,
      passwordLength: host.password ? host.password.length : 0
    });

    let isMatch = false;
    
    // Primary check: Try to match password against Host's password
    if (host.password) {
      try {
        isMatch = await host.matchPassword(password);
        console.log('Host password match result:', isMatch);
        if (isMatch) {
          console.log('✓ Password matched with Host password');
        }
      } catch (err) {
        console.error('Host password match error:', err.message, err.stack);
        // Continue to fallback checks below
      }
    } else {
      console.log('Host has no password stored, checking fallback options...');
    }
    
    // Fallback: For backwards compatibility with hosts created before separate password hashing
    // Check User password if Host password doesn't match and User exists
    if (!isMatch && host.user) {
      try {
        const user = await User.findById(host.user).select('+password');
        if (user && user.password) {
          // Match password against user's password
          isMatch = await bcrypt.compare(password, user.password);
          
          if (isMatch) {
            console.log('Password matched with User, but Host and User passwords are now separate.');
            console.log('Consider resetting Host password to use Host login in the future.');
            // Note: We don't update Host password anymore since they should be separate
            // The host should reset their password if they want to use Host-specific login
          }
        }
      } catch (err) {
        console.error('Error checking linked user:', err.message);
      }
    }
    
    // Last fallback: Check if User exists with same email (for very old hosts without user link)
    if (!isMatch) {
      try {
        const user = await User.findOne({ email, isHost: true, role: 'host' }).select('+password');
        if (user && user.password) {
          isMatch = await bcrypt.compare(password, user.password);
          
          if (isMatch) {
            console.log('Password matched with User by email, but Host and User passwords are now separate.');
            // Link the user if not already linked
            if (!host.user) {
              await Host.updateOne({ _id: host._id }, { $set: { user: user._id } });
            }
          }
        }
      } catch (err) {
        console.error('Error checking user by email:', err.message);
      }
    }

    if (!isMatch) {
      console.error('Login failed: Password does not match for email:', email);
      console.error('Attempted all password checks: Host password, linked User, User by email');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    console.log('✓ Login successful for host:', email);
    // Send token
    sendTokenResponse(host, 200, res, true);
  } catch (err) {
    console.error('Login host error:', err);
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

