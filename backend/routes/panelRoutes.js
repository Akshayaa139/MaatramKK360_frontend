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
  getPanelEvaluations 
} = require('../controllers/panelController');
const { protect, admin, volunteer } = require('../middleware/authMiddleware');

// Panel routes
router.route('/').get(protect, admin, getPanels);
router.route('/:id').get(protect, admin, getPanelById);
router.route('/').post(protect, admin, createPanel);

// Timeslot routes
router.route('/timeslots/register').post(protect, volunteer, registerTimeslot);
router.route('/timeslots/available').get(protect, admin, getAvailableTimeslots);

// Batch routes
router.route('/batches').post(protect, admin, createBatch);

// Evaluation routes
router.route('/evaluations').post(protect, volunteer, submitEvaluation);
router.route('/evaluations/:panelId').get(protect, admin, getPanelEvaluations);

module.exports = router;