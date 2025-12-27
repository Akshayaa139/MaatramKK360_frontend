const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecret = process.env.JWT_SECRET || 'devsecret';

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // console.log("Auth Headers:", req.headers.authorization); // Debugging log

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    // Only send response if not already sent (though return above handles it, good practice)
    if (!res.headersSent) {
      res.status(401).json({ message: 'Not authorized, no token' });
    }
  }
};

// Admin or Lead middleware
const admin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  console.log(`[DEBUG] Admin middleware check: User=${req.user?.email}, Role=${role}`);
  if (req.user && (role === 'admin' || role === 'lead')) {
    next();
  } else {
    console.warn(`[DEBUG] Admin access denied for User=${req.user?.email}, Role=${role}`);
    res.status(401).json({ message: 'Not authorized as an admin/lead' });
  }
};

// Volunteer only middleware
const volunteer = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (req.user && (role === 'volunteer' || role === 'alumni')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a volunteer' });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user.role || "").toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());

    if (!authorizedRoles.includes(userRole)) {
      console.warn(`Access Denied: Role '${userRole}' not in [${authorizedRoles.join(', ')}]`);
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, admin, volunteer, authorize };
