const express = require('express');
const router = express.Router();
const { getSessions, createSession, cancelSession, requestSession, getMentoringRequests, updateRequestStatus } = require('../controllers/mentoringController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('tutor'), getSessions) // Fallback for old calls if any
    .post(protect, authorize('tutor'), createSession);

router.get('/sessions', protect, getSessions); // New unified route for sessions
router.get('/requests', protect, authorize('tutor'), getMentoringRequests);
router.post('/request', protect, authorize('student'), requestSession);
router.put('/requests/:id/status', protect, authorize('tutor'), updateRequestStatus);

router.put('/:id/cancel', protect, authorize('tutor'), cancelSession);

module.exports = router;
