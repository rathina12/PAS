// ============================================================
// server.js - Main Entry Point for the Backend Server
// ============================================================
// This file sets up the Express server, connects to MongoDB,
// and registers all API routes.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// ── Middleware ──────────────────────────────────────────────
// Parse incoming JSON request bodies
app.use(express.json());

// Enable Cross-Origin Resource Sharing so React (port 3000)
// can talk to Express (port 5000)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// ── Routes ──────────────────────────────────────────────────
// Import route files
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const appraisalRoutes = require('./routes/appraisals');
const reportRoutes    = require('./routes/reports');

// Register routes with base paths
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/reports',    reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ── Database Connection ─────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    // Start the server only after DB connection succeeds
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit process on DB failure
  });
