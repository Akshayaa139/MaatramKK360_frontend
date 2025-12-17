const express = require('express');
const router = express.Router();
const { 
    assignForTeleverification, 
    updateTeleverificationStatus, 
    getTeleverifications 
} = require('../controllers/televerificationController');
const { getTeleverificationDetails } = require('../controllers/televerificationController');
const { protect, admin, volunteer } = require('../middleware/authMiddleware');

// Route to assign an application for tele-verification (Admin only)
router.post('/assign', protect, admin, assignForTeleverification);

// Route to update tele-verification status (Volunteer only)
router.put('/:id', protect, volunteer, updateTeleverificationStatus);

// Route to get all tele-verification records (Admin only)
router.get('/', protect, admin, getTeleverifications);

// Volunteer: list my assigned tele-verifications
router.get('/mine', protect, volunteer, require('../controllers/televerificationController').getMyTeleverifications);

// Volunteer: get full application details for a specific assigned tele-verification
router.get('/:id/details', protect, volunteer, getTeleverificationDetails);

module.exports = router;
