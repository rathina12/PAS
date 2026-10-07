// ============================================================
// models/Appraisal.js  — OOAD: Appraisal Entity Class
// ============================================================
// Represents the core domain object of the system.
// Encapsulates state (ratings, scores, status) and behaviour
// (score calculation, grade derivation) in one place.

const mongoose = require('mongoose');

// ── Known rating field names (prevents Mongoose internals leaking in) ──
const RATING_KEYS = [
  'communication', 'technicalSkills', 'teamwork',
  'punctuality', 'leadership', 'problemSolving'
];

// Sub-schema for a set of criteria ratings (1-5 each)
const RatingSchema = new mongoose.Schema({
  communication:   { type: Number, min: 1, max: 5, default: null },
  technicalSkills: { type: Number, min: 1, max: 5, default: null },
  teamwork:        { type: Number, min: 1, max: 5, default: null },
  punctuality:     { type: Number, min: 1, max: 5, default: null },
  leadership:      { type: Number, min: 1, max: 5, default: null },
  problemSolving:  { type: Number, min: 1, max: 5, default: null }
}, { _id: false });

const AppraisalSchema = new mongoose.Schema({

  // ── Associations (OOP: References / Relationships) ──────────
  employeeId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: [true, 'Employee ID is required']
  },
  managerId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    default:  null
  },

  // ── Appraisal Period ─────────────────────────────────────────
  period: {
    type:     String,
    required: [true, 'Appraisal period is required'],
    trim:     true
  },
  year: {
    type:    Number,
    default: () => new Date().getFullYear()
  },

  // ── Self-Appraisal (filled by Employee) ─────────────────────
  selfRatings:  { type: RatingSchema, default: () => ({}) },
  selfComments: {
    communication:   { type: String, trim: true, default: '' },
    technicalSkills: { type: String, trim: true, default: '' },
    teamwork:        { type: String, trim: true, default: '' },
    punctuality:     { type: String, trim: true, default: '' },
    leadership:      { type: String, trim: true, default: '' },
    problemSolving:  { type: String, trim: true, default: '' },
    overall:         { type: String, trim: true, default: '' }
  },
  selfScore: { type: Number, default: 0 },

  // ── Manager Evaluation (filled by Manager) ───────────────────
  managerRatings:  { type: RatingSchema, default: () => ({}) },
  managerComments: {
    communication:   { type: String, trim: true, default: '' },
    technicalSkills: { type: String, trim: true, default: '' },
    teamwork:        { type: String, trim: true, default: '' },
    punctuality:     { type: String, trim: true, default: '' },
    leadership:      { type: String, trim: true, default: '' },
    problemSolving:  { type: String, trim: true, default: '' },
    overall:         { type: String, trim: true, default: '' },
    strengths:       { type: String, trim: true, default: '' },
    improvements:    { type: String, trim: true, default: '' }
  },
  managerScore: { type: Number, default: 0 },

  // ── Computed Results ─────────────────────────────────────────
  finalScore: { type: Number, default: 0 },
  grade: {
    type:    String,
    enum:    ['A', 'B', 'C', 'D', 'F', 'N/A'],
    default: 'N/A'
  },

  // ── Workflow State (State Pattern) ───────────────────────────
  status: {
    type:    String,
    enum:    ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft'
  },

  submittedAt: { type: Date, default: null },
  reviewedAt:  { type: Date, default: null }

}, { timestamps: true });

// Prevent duplicate submissions even when requests arrive concurrently.
AppraisalSchema.index({ employeeId: 1, period: 1, year: 1 }, { unique: true });

// ── Static: Calculate average score from a ratings object ───
// Uses explicit RATING_KEYS to avoid Mongoose internal properties
AppraisalSchema.statics.calculateScore = function (ratingsObj) {
  if (!ratingsObj) return 0;

  const values = RATING_KEYS
    .map(k => {
      // Handle both plain objects and Mongoose subdocuments
      const v = ratingsObj[k] ?? (ratingsObj.toObject ? ratingsObj.toObject()[k] : null);
      return typeof v === 'number' && v > 0 ? v : null;
    })
    .filter(v => v !== null);

  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return parseFloat(avg.toFixed(2));
};

// ── Static: Convert numeric score to letter grade ───────────
AppraisalSchema.statics.scoreToGrade = function (score) {
  if (!score || score <= 0) return 'N/A';
  if (score >= 4.5) return 'A';
  if (score >= 3.5) return 'B';
  if (score >= 2.5) return 'C';
  if (score >= 1.5) return 'D';
  return 'F';
};

module.exports = mongoose.model('Appraisal', AppraisalSchema);
