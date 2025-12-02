const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');


// Protect routes middleware
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Or from cookies if you want to support cookie-based auth
    const cookieToken = req.cookies?.token;
    const finalToken = token || cookieToken;

    if (!finalToken) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(finalToken, process.env.JWT_SECRET);

    // Attach user or host depending on payload
    if (decoded.isHost) {
      const host = await Host.findById(decoded.id);
      if (!host) {
        return res.status(401).json({ message: 'Host not found' });
      }
      req.host = host;
      req.isHost = true;
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      req.isHost = false;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;

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
