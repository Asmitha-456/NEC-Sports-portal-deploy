const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'nec_sports_super_secure_jwt_secret_key_2026';

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch latest user info
    const user = db.findOne('users', u => u.id === decoded.id || u.email === decoded.email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: User no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: err.message });
  }
};

// Optional authentication - populates req.user if token present, continues regardless
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findOne('users', u => u.id === decoded.id || u.email === decoded.email);
      if (user) req.user = user;
    } catch {
      // Ignore token failure for public endpoints
    }
  }
  next();
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] role(s). Your role is '${req.user.role}'.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  JWT_SECRET
};
