const express = require('express');
const router = express.Router();
const { getStudentsPendingPanel } = require('../controllers/studentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/pending-panel').get(protect, admin, getStudentsPendingPanel);

module.exports = router;