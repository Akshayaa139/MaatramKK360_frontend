const express = require('express');
const router = express.Router();
const { generateStudentReport, generateClassReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student/:id', protect, authorize('tutor', 'admin'), generateStudentReport);
router.get('/class', protect, authorize('tutor', 'admin'), generateClassReport);

module.exports = router;
