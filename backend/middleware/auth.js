const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.isHost) {
      req.host = await Host.findById(decoded.id);
      req.isHost = true;
    } else {
      req.user = await User.findById(decoded.id);
      req.isHost = false;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.isHost) {
      if (!roles.includes('host')) {
        return res.status(403).json({
          success: false,
          error: `Host role is not authorized to access this route`
        });
      }
    } else {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `User role ${req.user.role} is not authorized to access this route`
        });
      }
    }
    next();
  };
};
