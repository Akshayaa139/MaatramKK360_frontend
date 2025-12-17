const express = require('express');
const path = require('path');
const multer = require('multer');
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

// File upload for tests (optional)
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/tests');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
const upload = multer({ dest: uploadDir });

// Tutor test management
router.post('/', protect, authorize('tutor'), upload.single('file'), createTest);
router.get('/:classId', protect, authorize('tutor'), getTests);
router.put('/:testId', protect, authorize('tutor'), upload.single('file'), updateTest);
router.delete('/:testId', protect, authorize('tutor'), deleteTest);

module.exports = router;
