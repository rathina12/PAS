// ============================================================
// controllers/authController.js - Authentication Logic
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: Generate JWT Token ───────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ── @route  POST /api/auth/register ─────────────────────────
// @desc    Register a new user (primarily used for initial admin setup)
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, department, designation } = req.body;

    // Public sign-up must never grant privileged roles. Managers/admins are
    // provisioned by an authenticated administrator instead.
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 12) {
      return res.status(400).json({ success: false, message: 'Password must contain at least 12 characters.' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create the new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role:        'employee',
      department:  department || 'General',
      designation: designation || 'Staff'
    });

    // Generate token for the newly created user
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        department:  user.department,
        designation: user.designation
      }
    });
  } catch (err) {
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── @route  POST /api/auth/login ────────────────────────────
// @desc    Login and receive a JWT token
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user and explicitly include password (select: false by default)
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact admin.'
      });
    }

    // Compare entered password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        department:  user.department,
        designation: user.designation,
        managerId:   user.managerId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── @route  GET /api/auth/me ─────────────────────────────────
// @desc    Get current logged-in user info
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('managerId', 'name email');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
