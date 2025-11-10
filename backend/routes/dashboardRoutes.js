const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getRecentActivities, 
  getUpcomingSessions,
  getApplicationStats,
  getTeleverificationStats,
  getPanelStats
} = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/stats').get(protect, admin, getDashboardStats);
router.route('/recent-activities').get(protect, admin, getRecentActivities);
router.route('/upcoming-sessions').get(protect, admin, getUpcomingSessions);
router.route('/applications/stats').get(protect, admin, getApplicationStats);
router.route('/televerification/stats').get(protect, admin, getTeleverificationStats);
router.route('/panels/stats').get(protect, admin, getPanelStats);

module.exports = router;