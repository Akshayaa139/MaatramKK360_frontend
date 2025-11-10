const express = require('express');
const router = express.Router();
const { getTestStats, getUpcomingTests } = require('../controllers/testController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, admin, getTestStats);
router.route('/upcoming').get(protect, admin, getUpcomingTests);

module.exports = router;