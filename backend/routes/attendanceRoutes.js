const express = require('express');
const router = express.Router();
const { getAttendance, updateAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// Get attendance for a specific class
router.get('/:classId', protect, getAttendance);

// Update attendance for a specific class
router.put('/:classId', protect, updateAttendance);

module.exports = router;