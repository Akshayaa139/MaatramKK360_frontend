const express = require('express');
const router = express.Router();
const { 
    assignForTeleverification, 
    updateTeleverificationStatus, 
    getTeleverifications 
} = require('../controllers/televerificationController');
const { protect, admin, volunteer } = require('../middleware/authMiddleware');

// Route to assign an application for tele-verification (Admin only)
router.post('/assign', protect, admin, assignForTeleverification);

// Route to update tele-verification status (Volunteer only)
router.put('/:id', protect, volunteer, updateTeleverificationStatus);

// Route to get all tele-verification records (Admin only)
router.get('/', protect, admin, getTeleverifications);

module.exports = router;