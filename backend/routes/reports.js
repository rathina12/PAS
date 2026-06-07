// routes/reports.js
const express = require('express');
const router  = express.Router();
const { getSummary, getPerformanceReport, getEmployeeReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary',          authorize('admin'), getSummary);
router.get('/performance',      authorize('admin'), getPerformanceReport);
router.get('/employee/:id',     authorize('admin', 'manager'), getEmployeeReport);

module.exports = router;
