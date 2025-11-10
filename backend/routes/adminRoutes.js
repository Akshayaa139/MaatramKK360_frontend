const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  exportApplications,
  getApplicationAnalytics
} = require('../controllers/adminController');
const {
  getAllTeleverifications,
  assignTeleverification,
  updateTeleverificationStatus,
  getTeleverificationAnalytics
} = require('../controllers/televerificationController');
const {
  getAllPanels,
  createPanel,
  updatePanel,
  deletePanel,
  assignPanelists,
  getPanelAnalytics
} = require('../controllers/panelController');
const {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  getUserAnalytics
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Application Management
router.route('/applications')
  .get(protect, admin, getAllApplications);
router.route('/applications/:id')
  .get(protect, admin, getApplicationById)
  .put(protect, admin, updateApplicationStatus);
router.route('/applications/export')
  .get(protect, admin, exportApplications);
router.route('/applications/analytics')
  .get(protect, admin, getApplicationAnalytics);

// Tele-verification Management
router.route('/televerifications')
  .get(protect, admin, getAllTeleverifications);
router.route('/televerifications/assign')
  .post(protect, admin, assignTeleverification);
router.route('/televerifications/:id')
  .put(protect, admin, updateTeleverificationStatus);
router.route('/televerifications/analytics')
  .get(protect, admin, getTeleverificationAnalytics);

// Panel Management
router.route('/panels')
  .get(protect, admin, getAllPanels)
  .post(protect, admin, createPanel);
router.route('/panels/:id')
  .put(protect, admin, updatePanel)
  .delete(protect, admin, deletePanel);
router.route('/panels/:id/assign-panelists')
  .post(protect, admin, assignPanelists);
router.route('/panels/analytics')
  .get(protect, admin, getPanelAnalytics);

// User Management
router.route('/users')
  .get(protect, admin, getAllUsers);
router.route('/users/:id/role')
  .put(protect, admin, updateUserRole);
router.route('/users/:id/deactivate')
  .put(protect, admin, deactivateUser);
router.route('/users/analytics')
  .get(protect, admin, getUserAnalytics);

module.exports = router;