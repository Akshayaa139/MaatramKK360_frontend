const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForStudent,
  submitAssignment,
  gradeAssignment,
  getAssignmentDetails
} = require('../controllers/assignmentController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Tutor Routes
router.route('/').post(protect, authorize('tutor'), upload.single('file'), createAssignment);
router.route('/:classId').get(protect, authorize('tutor'), getAssignments);

// Student Routes
router.route('/student/:classId').get(protect, authorize('student'), getAssignmentsForStudent);
router.route('/:id/submit').post(protect, authorize('student'), upload.single('file'), submitAssignment);

// Grading & Details Routes
router.route('/:id/grade').post(protect, authorize('tutor'), gradeAssignment);
router.route('/:id/details').get(protect, authorize('tutor'), getAssignmentDetails);

// Common Routes (Update/Delete)
router.route('/:assignmentId')
  .put(protect, authorize('tutor'), upload.single('file'), updateAssignment)
  .delete(protect, authorize('tutor'), deleteAssignment);

module.exports = router;