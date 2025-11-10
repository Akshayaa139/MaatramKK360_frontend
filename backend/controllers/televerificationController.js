const asyncHandler = require('express-async-handler');
const Televerification = require('../models/Televerification');
const Application = require('../models/Application');

// @desc    Assign an application for tele-verification
// @route   POST /api/televerification/assign
// @access  Private/Admin
exports.assignForTeleverification = asyncHandler(async (req, res) => {
    const { applicationId, volunteerId } = req.body;

    const televerification = await Televerification.create({
        application: applicationId,
        volunteer: volunteerId,
    });

    res.status(201).json({ 
        message: 'Application assigned for tele-verification successfully!', 
        televerification 
    });
});

// @desc    Update tele-verification status
// @route   PUT /api/televerification/:id
// @access  Private/Volunteer
exports.updateTeleverificationStatus = asyncHandler(async (req, res) => {
    const { status, remarks } = req.body;

    const televerification = await Televerification.findById(req.params.id);

    if (televerification) {
        televerification.status = status;
        televerification.remarks = remarks;
        const updatedTeleverification = await televerification.save();
        res.json(updatedTeleverification);
    } else {
        res.status(404);
        throw new Error('Tele-verification record not found');
    }
});

// @desc    Get all tele-verification records
// @route   GET /api/televerification
// @access  Private/Admin
exports.getTeleverifications = asyncHandler(async (req, res) => {
    const televerifications = await Televerification.find({}).populate('application').populate('volunteer');
    res.json(televerifications);
});