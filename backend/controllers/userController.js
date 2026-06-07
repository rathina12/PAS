// ============================================================
// controllers/userController.js - User Management Logic
// ============================================================

const User         = require('../models/User');
const Appraisal    = require('../models/Appraisal');
const Notification = require('../models/Notification');

// ── @route  GET /api/users ───────────────────────────────────
// @desc    Get all users (Admin only)
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = {};
    if (role)       filter.role       = role;
    if (department) filter.department = department;

    const users = await User.find(filter)
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ── @route  GET /api/users/team ──────────────────────────────
// @desc    Get team members for the logged-in manager
// @access  Private/Manager
const getMyTeam = async (req, res) => {
  try {
    const employees = await User.find({
      managerId: req.user._id,
      role:      'employee',
      isActive:  true
    }).select('-password');

    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch team.' });
  }
};

// ── @route  GET /api/users/:id ───────────────────────────────
// @desc    Get single user by ID
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('managerId', 'name email department');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

// ── @route  POST /api/users ──────────────────────────────────
// @desc    Create a new user (Admin only)
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, managerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const user = await User.create({
      name, email, password,
      role:        role || 'employee',
      department:  department || 'General',
      designation: designation || 'Staff',
      managerId:   managerId || null
    });

    // Send notification to the new user
    await Notification.create({
      userId:  user._id,
      title:   'Welcome to Performance Appraisal System',
      message: `Hello ${user.name}! Your account has been created with the role of ${user.role}.`,
      type:    'success'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully!',
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
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

// ── @route  PUT /api/users/:id ───────────────────────────────
// @desc    Update user (Admin only)
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, designation, managerId, isActive } = req.body;

    // Never update password through this route for security
    const updateData = { name, email, role, department, designation, isActive };
    if (managerId !== undefined) updateData.managerId = managerId || null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User updated successfully!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// ── @route  DELETE /api/users/:id ───────────────────────────
// @desc    Deactivate (soft delete) a user (Admin only)
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // We soft-delete (deactivate) instead of permanently deleting
    // to preserve appraisal history
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate user.' });
  }
};

// ── @route  GET /api/users/notifications ────────────────────
// @desc    Get notifications for current user
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// ── @route  PUT /api/users/notifications/:id/read ───────────
// @desc    Mark a notification as read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// ── @route  GET /api/users/managers ─────────────────────────
// @desc    Get all managers (for admin assign dropdown)
// @access  Private/Admin
const getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager', isActive: true })
      .select('name email department');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch managers.' });
  }
};

module.exports = {
  getAllUsers,
  getMyTeam,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getNotifications,
  markNotificationRead,
  getManagers
};
