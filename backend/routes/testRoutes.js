const express = require('express');
const router = express.Router();
const {
  getTestStats,
  getUpcomingTests,
  getTests,
  createTest,
  updateTest,
  deleteTest
} = require('../controllers/testController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

// Admin analytics
router.route('/stats').get(protect, admin, getTestStats);
router.route('/upcoming').get(protect, admin, getUpcomingTests);

// File upload for tests (optional) - REMOVED
// Tutor test management
router.post('/', protect, authorize('tutor'), createTest);
router.get('/:classId', protect, authorize('tutor'), getTests);
router.put('/:testId', protect, authorize('tutor'), updateTest);
router.delete('/:testId', protect, authorize('tutor'), deleteTest);

module.exports = router;
