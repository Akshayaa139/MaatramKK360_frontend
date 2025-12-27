const express = require('express');
const router = express.Router();
const { generateStudentReport, generateClassReport, generateGlobalReport, generateTutorReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student/:id', protect, authorize('tutor', 'admin', 'lead'), generateStudentReport);
router.get('/class/:id', protect, authorize('tutor', 'admin', 'lead'), generateClassReport);
router.get('/tutor/:id', protect, authorize('admin', 'lead'), generateTutorReport);
router.get('/global', protect, authorize('admin', 'lead'), generateGlobalReport);

module.exports = router;
