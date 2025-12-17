const express = require('express');
const router = express.Router();
const { 
  registerTimeslot, 
  getAvailableTimeslots, 
  createPanel, 
  createBatch, 
  submitEvaluation, 
  getPanels, 
  getPanelById, 
  getPanelEvaluations,
  createTimeslotAdmin 
} = require('../controllers/panelController');
const { protect, admin, volunteer, authorize } = require('../middleware/authMiddleware');

// Panel routes
router.route('/').get(protect, admin, getPanels);
router.route('/:id').get(protect, admin, getPanelById);
router.route('/').post(protect, admin, createPanel);
router.route('/create').post(protect, admin, createPanel);

// Timeslot routes
router.route('/timeslots/register').post(protect, authorize('tutor','volunteer','alumni'), registerTimeslot);
router.route('/timeslots/available').get(protect, admin, getAvailableTimeslots);
router.route('/timeslots/admin').post(protect, admin, createTimeslotAdmin);

// Batch routes
router.route('/batches').post(protect, admin, createBatch);

// Evaluation routes
router.route('/evaluations').post(protect, volunteer, submitEvaluation);
router.route('/evaluations/:panelId').get(protect, admin, getPanelEvaluations);

// Volunteer panels
router.route('/mine').get(protect, volunteer, require('../controllers/panelController').getMyPanels);

module.exports = router;
