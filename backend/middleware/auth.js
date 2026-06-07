// ============================================================
// middleware/auth.js - JWT Authentication Middleware
// ============================================================
// This middleware protects routes by verifying JWT tokens.
// It also provides role-based access control (RBAC).

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ─────────────────────────────────────────────────
// Verifies that the request has a valid JWT token.
// If valid, attaches the user object to req.user.
const protect = async (req, res, next) => {
  let token;

  // Check for token in the Authorization header
  // Format: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.'
    });
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from the token's payload (id)
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.'
      });
    }

    // Attach user to the request object for use in controllers
    req.user = user;
    next(); // Continue to the next middleware/controller
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

// ── authorize ────────────────────────────────────────────────
// Restricts access to specific roles.
// Usage: authorize('admin', 'manager')
// Returns a middleware function that checks if req.user.role
// is in the allowed roles list.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
