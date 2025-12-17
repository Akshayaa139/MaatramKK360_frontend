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
        status: 'Pending'
    });

    const app = await Application.findById(applicationId);
    if (app) {
        app.status = 'tele-verification';
        await app.save();
    }

    res.status(201).json({ 
        message: 'Application assigned for tele-verification successfully!', 
        televerification 
    });
});

// @desc    Update tele-verification status
// @route   PUT /api/televerification/:id
// @access  Private/Volunteer
exports.updateTeleverificationStatus = asyncHandler(async (req, res) => {
    const {
        status,
        remarks,
        callDate,
        callDurationMinutes,
        communicationSkills,
        subjectKnowledge,
        confidenceLevel,
        familySupport,
        financialNeed,
        overallRating,
        recommendation,
        comments
    } = req.body;

    const televerification = await Televerification.findById(req.params.id);

    if (!televerification) {
        res.status(404);
        throw new Error('Tele-verification record not found');
    }

    if (status) televerification.status = status;
    if (remarks) televerification.remarks = remarks;
    if (callDate) televerification.callDate = new Date(callDate);
    if (callDurationMinutes !== undefined) televerification.callDurationMinutes = Number(callDurationMinutes) || 0;
    if (communicationSkills !== undefined) televerification.communicationSkills = Number(communicationSkills);
    if (subjectKnowledge !== undefined) televerification.subjectKnowledge = Number(subjectKnowledge);
    if (confidenceLevel !== undefined) televerification.confidenceLevel = Number(confidenceLevel);
    if (familySupport !== undefined) televerification.familySupport = Number(familySupport);
    if (financialNeed !== undefined) televerification.financialNeed = Number(financialNeed);
    if (overallRating !== undefined) televerification.overallRating = Number(overallRating);
    if (recommendation) televerification.recommendation = recommendation;
    if (comments) televerification.comments = comments;

    const updatedTeleverification = await televerification.save();

    if (recommendation) {
        const app = await Application.findById(televerification.application);
        if (app) {
            if (recommendation === 'selected') app.status = 'selected';
            else if (recommendation === 'rejected') app.status = 'rejected';
            else if (recommendation === 'waitlist') app.status = 'waitlist';
            await app.save();
        }
    }

    res.json(updatedTeleverification);
});

// @desc    Get all tele-verification records
// @route   GET /api/televerification
// @access  Private/Admin
exports.getTeleverifications = asyncHandler(async (req, res) => {
    const televerifications = await Televerification.find({}).populate('application').populate('volunteer');
    res.json(televerifications);
});

// @desc    Get all tele-verification records (alias for admin routes)
// @route   GET /api/admin/televerifications
// @access  Private/Admin
exports.getAllTeleverifications = exports.getTeleverifications;

// @desc    Assign an application for tele-verification (alias for admin routes)
// @route   POST /api/admin/televerifications/assign
// @access  Private/Admin
exports.assignTeleverification = exports.assignForTeleverification;

// @desc    Get tele-verification analytics
// @route   GET /api/admin/televerifications/analytics
// @access  Private/Admin
exports.getTeleverificationAnalytics = asyncHandler(async (req, res) => {
    // Get televerifications by status
    const statusStats = await Televerification.aggregate([
        {
            $group: {
                _id: { $ifNull: ['$status', 'pending'] },
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Get total televerifications
    const totalTeleverifications = await Televerification.countDocuments();
    
    // Get completed televerifications
    const completedCount = await Televerification.countDocuments({ status: 'completed' });
    
    // Get televerifications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timeSeriesStats = await Televerification.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
    
    res.json({
        statusStats,
        totalTeleverifications,
        completedCount,
        timeSeriesStats
    });
});
// @desc    Get tele-verification records assigned to current volunteer/alumni
// @route   GET /api/televerification/mine
// @access  Private/Volunteer
exports.getMyTeleverifications = asyncHandler(async (req, res) => {
    const tvs = await Televerification.find({ volunteer: req.user._id })
        .populate('application')
        .populate('volunteer', 'name email role');
    res.json(tvs);
});

// @desc    Get full application details for a specific tele-verification assigned to the current volunteer
// @route   GET /api/televerification/:id/details
// @access  Private/Volunteer
exports.getTeleverificationDetails = asyncHandler(async (req, res) => {
    const tv = await Televerification.findById(req.params.id).populate('application');
    if (!tv) {
        res.status(404);
        throw new Error('Tele-verification record not found');
    }
    if (String(tv.volunteer) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized');
    }
    res.json({ application: tv.application, televerificationId: tv._id });
});
