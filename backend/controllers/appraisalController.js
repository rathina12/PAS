// ============================================================
// controllers/appraisalController.js
// OOAD Role: Controller in MVC — delegates between Routes and Models
// ============================================================

const Appraisal    = require('../models/Appraisal');
const Notification = require('../models/Notification');

// ── Helper: compute score + grade from a plain ratings object ──
const calcScoreAndGrade = (ratings) => {
  const score = Appraisal.calculateScore(ratings);
  const grade = Appraisal.scoreToGrade(score);
  return { score, grade };
};

// ── Helper: safe string comparison of MongoDB ObjectIds ────────
const sameId = (a, b) => {
  if (!a || !b) return false;
  return a.toString() === b.toString();
};

// ══════════════════════════════════════════════════════════════
// @route  POST /api/appraisals
// @desc   Employee submits (or re-drafts) their self-appraisal
// @access Private — Employee only
// ══════════════════════════════════════════════════════════════
const submitSelfAppraisal = async (req, res) => {
  try {
    const { period, year, selfRatings, selfComments } = req.body;

    if (!period) {
      return res.status(400).json({ success: false, message: 'Appraisal period is required.' });
    }

    const appraisalYear = year || new Date().getFullYear();

    // Check if one already exists for this period/year
    const existing = await Appraisal.findOne({
      employeeId: req.user._id,
      period,
      year: appraisalYear
    });

    if (existing && !['draft'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: `An appraisal for "${period}" has already been submitted and cannot be re-submitted.`
      });
    }

    const { score: selfScore } = calcScoreAndGrade(selfRatings);

    let appraisal;
    if (existing) {
      // Update the draft
      existing.selfRatings  = selfRatings;
      existing.selfComments = selfComments || {};
      existing.selfScore    = selfScore;
      existing.managerId    = req.user.managerId || null;
      existing.status       = 'submitted';
      existing.submittedAt  = new Date();
      appraisal = await existing.save();
    } else {
      appraisal = await Appraisal.create({
        employeeId:   req.user._id,
        managerId:    req.user.managerId || null,
        period,
        year:         appraisalYear,
        selfRatings:  selfRatings  || {},
        selfComments: selfComments || {},
        selfScore,
        status:       'submitted',
        submittedAt:  new Date()
      });
    }

    // Notify the manager if one is assigned
    if (req.user.managerId) {
      await Notification.create({
        userId:  req.user.managerId,
        title:   'New Self-Appraisal Submitted',
        message: `${req.user.name} has submitted their self-appraisal for ${period} ${appraisalYear}.`,
        type:    'info'
      });
    }

    return res.status(201).json({
      success:  true,
      message:  'Self-appraisal submitted successfully!',
      appraisal
    });
  } catch (err) {
    console.error('submitSelfAppraisal error:', err);
    return res.status(500).json({ success: false, message: 'Server error during submission.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  GET /api/appraisals/my
// @desc   Get all appraisals for the logged-in employee
// @access Private
// ══════════════════════════════════════════════════════════════
const getMyAppraisals = async (req, res) => {
  try {
    const appraisals = await Appraisal.find({ employeeId: req.user._id })
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ success: true, appraisals });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your appraisals.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  GET /api/appraisals/team
// @desc   Get all appraisals for the logged-in manager's team
// @access Private — Manager only
// ══════════════════════════════════════════════════════════════
const getTeamAppraisals = async (req, res) => {
  try {
    const { status, period } = req.query;
    const filter = { managerId: req.user._id };
    if (status) filter.status = status;
    if (period) filter.period = period;

    const appraisals = await Appraisal.find(filter)
      .populate('employeeId', 'name email department designation')
      .sort({ createdAt: -1 });

    return res.json({ success: true, appraisals });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch team appraisals.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  GET /api/appraisals/all
// @desc   Get ALL appraisals in the system (admin view)
// @access Private — Admin only
// ══════════════════════════════════════════════════════════════
const getAllAppraisals = async (req, res) => {
  try {
    const { status, period, year } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (period) filter.period = period;
    if (year)   filter.year   = parseInt(year, 10);

    const appraisals = await Appraisal.find(filter)
      .populate('employeeId', 'name email department designation')
      .populate('managerId',  'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: appraisals.length, appraisals });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appraisals.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  GET /api/appraisals/:id
// @desc   Get a single appraisal by ID
// @access Private
// ══════════════════════════════════════════════════════════════
const getAppraisalById = async (req, res) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id)
      .populate('employeeId', 'name email department designation joiningDate')
      .populate('managerId',  'name email');

    if (!appraisal) {
      return res.status(404).json({ success: false, message: 'Appraisal not found.' });
    }

    // Access control: employee can only see their own, manager their team's
    const isAdmin   = req.user.role === 'admin';
    const isOwner   = sameId(appraisal.employeeId?._id, req.user._id);
    const isManager = sameId(appraisal.managerId?._id,  req.user._id);

    if (!isAdmin && !isOwner && !isManager) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, appraisal });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appraisal.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  PUT /api/appraisals/:id/evaluate
// @desc   Manager submits their evaluation of an employee
// @access Private — Manager only
// ══════════════════════════════════════════════════════════════
const evaluateAppraisal = async (req, res) => {
  try {
    const { managerRatings, managerComments, status } = req.body;

    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) {
      return res.status(404).json({ success: false, message: 'Appraisal not found.' });
    }

    // Ensure this manager is assigned to the appraisal
    if (!sameId(appraisal.managerId, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to evaluate this appraisal.'
      });
    }

    // Prevent re-evaluation of already finalised appraisals
    if (appraisal.status === 'approved' || appraisal.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This appraisal has already been ${appraisal.status}. It cannot be re-evaluated.`
      });
    }

    // Calculate manager score using explicit keys (avoids Mongoose internals)
    const { score: managerScore } = calcScoreAndGrade(managerRatings);

    // Final score = average of self and manager scores
    let finalScore;
    if (appraisal.selfScore > 0 && managerScore > 0) {
      finalScore = parseFloat(((appraisal.selfScore + managerScore) / 2).toFixed(2));
    } else {
      finalScore = managerScore || appraisal.selfScore || 0;
    }

    const grade = Appraisal.scoreToGrade(finalScore);

    // Persist evaluation
    appraisal.managerRatings  = managerRatings  || {};
    appraisal.managerComments = managerComments || {};
    appraisal.managerScore    = managerScore;
    appraisal.finalScore      = finalScore;
    appraisal.grade           = grade;
    appraisal.status          = status || 'approved';
    appraisal.reviewedAt      = new Date();

    await appraisal.save();

    // Notify the employee
    const action = appraisal.status === 'approved' ? 'approved ✅' : 'sent back for review';
    await Notification.create({
      userId:  appraisal.employeeId,
      title:   `Appraisal ${appraisal.status === 'approved' ? 'Approved' : 'Reviewed'}`,
      message: `Your appraisal for "${appraisal.period}" has been ${action}. Final Score: ${finalScore}/5 (Grade: ${grade})`,
      type:    appraisal.status === 'approved' ? 'success' : 'warning'
    });

    return res.json({
      success:  true,
      message:  `Appraisal ${appraisal.status} successfully!`,
      appraisal
    });
  } catch (err) {
    console.error('evaluateAppraisal error:', err);
    return res.status(500).json({ success: false, message: 'Server error during evaluation.' });
  }
};

// ══════════════════════════════════════════════════════════════
// @route  PUT /api/appraisals/:id/status
// @desc   Quick status update (manager/admin)
// @access Private — Manager, Admin
// ══════════════════════════════════════════════════════════════
const updateAppraisalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['under_review', 'approved', 'rejected'];

    if (!valid.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${valid.join(', ')}`
      });
    }

    // Only administrators may use the status override; do not rewrite finalised reviews.
    const appraisal = await Appraisal.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['submitted', 'under_review'] } },
      { $set: { status, reviewedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!appraisal) {
      return res.status(404).json({ success: false, message: 'Appraisal not found or already finalised.' });
    }

    return res.json({ success: true, message: 'Status updated.', appraisal });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

module.exports = {
  submitSelfAppraisal,
  getMyAppraisals,
  getTeamAppraisals,
  getAllAppraisals,
  getAppraisalById,
  evaluateAppraisal,
  updateAppraisalStatus
};
