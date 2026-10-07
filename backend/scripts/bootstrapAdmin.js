// One-time initial administrator provisioning.
// Run with ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI, JWT_SECRET in environment.
// No public HTTP route creates privileged users.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGO_URI) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD and MONGO_URI are required');
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  await mongoose.connect(MONGO_URI);
  const existingAdmins = await User.countDocuments({ role: 'admin' });
  if (existingAdmins > 0) throw new Error('An administrator already exists; use the authenticated admin UI');
  const user = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.trim().toLowerCase(),
    password: ADMIN_PASSWORD,
    role: 'admin',
    department: 'Administration',
    designation: 'Administrator'
  });
  console.log('Initial administrator created:', user.email);
}
main().catch(err => { console.error(err.message); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
