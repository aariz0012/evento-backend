const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route' 
      });
    }

    try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   // Check if the token is for a host or a regular user
      const host = await Host.findById(decoded.id);
      if (host) {
        req.host = host;
        req.user = host; // For compatibility with existing code
        req.isHost = true;
      } else {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }
        req.user = user;
        req.isHost = false;
      }
      
      next();
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, token failed' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
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
      if (!roles.includes('user')) {  // Changed from req.user.role to 'user' since we're not using roles
        return res.status(403).json({
          success: false,
          error: `User is not authorized to access this route`
        });
      }
    }
    next();
  };
};
