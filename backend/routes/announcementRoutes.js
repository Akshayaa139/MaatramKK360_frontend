const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement } = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAnnouncements)
    .post(protect, authorize('tutor', 'admin'), createAnnouncement);

module.exports = router;
