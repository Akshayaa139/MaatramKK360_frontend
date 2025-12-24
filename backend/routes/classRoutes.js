const express = require('express');
const router = express.Router();
const { getTutorClasses, getAllClasses, updateClassSchedule, startClassSession, createClass, logSessionEvent, getLiveSessions, joinClassSession } = require('../controllers/classController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

// Get all classes for a specific tutor
router.get('/tutor', protect, getTutorClasses);

router.get('/sessions/live', protect, admin, getLiveSessions);

router.get('/all', protect, admin, getAllClasses);

// Update class schedule (tutor)
router.put('/:classId/schedule', protect, authorize('tutor'), updateClassSchedule);

// Start class session (generate link + init attendance)
router.post('/:classId/start', protect, authorize('tutor'), startClassSession);

// Join class session (get details)
router.post('/:classId/join', protect, joinClassSession);

// Create new class
router.post('/', protect, authorize('tutor'), createClass);

// Session Logging
router.route('/session/:sessionId/log').post(protect, logSessionEvent);

module.exports = router;
