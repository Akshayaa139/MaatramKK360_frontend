const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

router.route('/').post(protect, authorize('tutor'), createAssignment);
router.route('/:classId').get(protect, authorize('tutor'), getAssignments);
router.route('/:assignmentId').put(protect, authorize('tutor'), updateAssignment).delete(protect, authorize('tutor'), deleteAssignment);

module.exports = router;