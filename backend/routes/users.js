// routes/users.js
const express = require('express');
const router  = express.Router();
const {
  getAllUsers, getMyTeam, getUserById,
  createUser, updateUser, deleteUser,
  getNotifications, markNotificationRead, getManagers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes below require authentication
router.use(protect);

router.get('/managers',                          authorize('admin'), getManagers);
router.get('/team',                              authorize('manager'), getMyTeam);
router.get('/notifications',                     getNotifications);
router.put('/notifications/:id/read',            markNotificationRead);

router.route('/')
  .get(authorize('admin'), getAllUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
