// routes/appraisals.js
const express = require('express');
const router  = express.Router();
const {
  submitSelfAppraisal, getMyAppraisals,
  getTeamAppraisals, getAllAppraisals,
  getAppraisalById, evaluateAppraisal, updateAppraisalStatus
} = require('../controllers/appraisalController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my',    getMyAppraisals);
router.get('/team',  authorize('manager'), getTeamAppraisals);
router.get('/all',   authorize('admin'),   getAllAppraisals);

router.post('/',     authorize('employee'), submitSelfAppraisal);

router.route('/:id')
  .get(getAppraisalById);

router.put('/:id/evaluate', authorize('manager'), evaluateAppraisal);
router.put('/:id/status',   authorize('manager', 'admin'), updateAppraisalStatus);

module.exports = router;
