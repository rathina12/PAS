// ============================================================
// models/User.js - User Database Schema
// ============================================================
// Defines the structure of a User document in MongoDB.
// Mongoose schemas are like blueprints for your data.

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Full name of the user
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
    minlength: [2, 'Name must be at least 2 characters']
  },

  // Email used for login - must be unique
  email: {
    type:     String,
    required: [true, 'Email is required'],
    unique:   true,
    lowercase: true,
    trim:      true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  // Hashed password (we never store plain text passwords!)
  password: {
    type:     String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:   false  // Don't return password in queries by default
  },

  // Role determines what the user can see and do
  role: {
    type:    String,
    enum:    ['admin', 'manager', 'employee'],
    default: 'employee'
  },

  // Department the user belongs to
  department: {
    type:    String,
    trim:    true,
    default: 'General'
  },

  // Designation / Job Title
  designation: {
    type:    String,
    trim:    true,
    default: 'Staff'
  },

  // Which manager this employee reports to
  // References another User document (manager's _id)
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    default: null
  },

  // Date user joined the company
  joiningDate: {
    type:    Date,
    default: Date.now
  },

  // Whether the account is active
  isActive: {
    type:    Boolean,
    default: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// ── Pre-save Hook ───────────────────────────────────────────
// This runs automatically BEFORE saving a user to the database.
// It hashes the password so we never store plain text.
UserSchema.pre('save', async function(next) {
  // Only hash if password was modified (not on every save)
  if (!this.isModified('password')) return next();

  // Generate a salt (random data to make hashing unique)
  const salt = await bcrypt.genSalt(10);

  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method ─────────────────────────────────────────
// Custom method to compare entered password with stored hash
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
