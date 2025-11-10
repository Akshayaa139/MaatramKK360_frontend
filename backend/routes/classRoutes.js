const express = require('express');
const router = express.Router();
const { getTutorClasses } = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

// Get all classes for a specific tutor
router.get('/tutor', protect, getTutorClasses);

module.exports = router;