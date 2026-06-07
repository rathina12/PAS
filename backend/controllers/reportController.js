// ============================================================
// controllers/reportController.js - Analytics & Reports
// ============================================================

const Appraisal = require('../models/Appraisal');
const User      = require('../models/User');

// ── @route  GET /api/reports/summary ────────────────────────
// @desc    Overall system statistics (Admin)
// @access  Private/Admin
const getSummary = async (req, res) => {
  try {
    const [
      totalEmployees,
      totalManagers,
      totalAppraisals,
      approvedAppraisals,
      pendingAppraisals,
      avgScoreResult
    ] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'manager',  isActive: true }),
      Appraisal.countDocuments(),
      Appraisal.countDocuments({ status: 'approved' }),
      Appraisal.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Appraisal.aggregate([
        { $match: { status: 'approved', finalScore: { $gt: 0 } } },
        { $group: { _id: null, avgScore: { $avg: '$finalScore' } } }
      ])
    ]);

    const avgScore = avgScoreResult[0]?.avgScore
      ? parseFloat(avgScoreResult[0].avgScore.toFixed(2))
      : 0;

    // Grade distribution
    const gradeDistribution = await Appraisal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Department-wise average scores
    const deptScores = await Appraisal.aggregate([
      { $match: { status: 'approved', finalScore: { $gt: 0 } } },
      {
        $lookup: {
          from:         'users',
          localField:   'employeeId',
          foreignField: '_id',
          as:           'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id:      '$employee.department',
          avgScore: { $avg: '$finalScore' },
          count:    { $sum: 1 }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    res.json({
      success: true,
      summary: {
        totalEmployees,
        totalManagers,
        totalAppraisals,
        approvedAppraisals,
        pendingAppraisals,
        avgScore,
        gradeDistribution,
        deptScores
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate summary.' });
  }
};

// ── @route  GET /api/reports/performance ────────────────────
// @desc    Performance report for all employees (Admin)
// @access  Private/Admin
const getPerformanceReport = async (req, res) => {
  try {
    const { period, year, department } = req.query;
    const matchFilter = { status: 'approved' };
    if (period) matchFilter.period = period;
    if (year)   matchFilter.year   = parseInt(year);

    const report = await Appraisal.find(matchFilter)
      .populate('employeeId', 'name email department designation')
      .populate('managerId',  'name email')
      .sort({ finalScore: -1 });

    // Filter by department after populate
    const filtered = department
      ? report.filter(r => r.employeeId?.department === department)
      : report;

    res.json({ success: true, count: filtered.length, report: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

// ── @route  GET /api/reports/employee/:id ───────────────────
// @desc    Full appraisal history for a specific employee
// @access  Private/Admin,Manager
const getEmployeeReport = async (req, res) => {
  try {
    const appraisals = await Appraisal.find({ employeeId: req.params.id })
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });

    const employee = await User.findById(req.params.id)
      .populate('managerId', 'name email');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Calculate average score across all approved appraisals
    const approved = appraisals.filter(a => a.status === 'approved');
    const avgScore = approved.length > 0
      ? parseFloat((approved.reduce((s, a) => s + a.finalScore, 0) / approved.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      employee,
      appraisals,
      stats: {
        total:    appraisals.length,
        approved: approved.length,
        avgScore
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch employee report.' });
  }
};

module.exports = { getSummary, getPerformanceReport, getEmployeeReport };
