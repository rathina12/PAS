// ============================================================
// models/Notification.js - Notification Schema
// ============================================================

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Who receives the notification
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },

  // Short title of the notification
  title: {
    type:     String,
    required: true,
    trim:     true
  },

  // Detailed message
  message: {
    type:     String,
    required: true,
    trim:     true
  },

  // Type for styling (info, success, warning, error)
  type: {
    type:    String,
    enum:    ['info', 'success', 'warning', 'error'],
    default: 'info'
  },

  // Whether the user has read the notification
  isRead: {
    type:    Boolean,
    default: false
  },

  // Link to related resource (optional)
  link: {
    type:    String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
