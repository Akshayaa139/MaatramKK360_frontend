const asyncHandler = require('express-async-handler');
const Panel = require('../models/Panel');
const Timeslot = require('../models/Timeslot');
const Batch = require('../models/Batch');
const InterviewEvaluation = require('../models/InterviewEvaluation');
const Application = require('../models/Application');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// @desc    Register a timeslot for panel interview
// @route   POST /api/panels/timeslots
// @access  Private/Volunteer or Alumni
exports.registerTimeslot = asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.body;
    
    const timeslot = await Timeslot.create({
        panelist: req.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
    });

    res.status(201).json({
        message: 'Timeslot registered successfully',
        timeslot
    });
});

// @desc    Get available timeslots
// @route   GET /api/panels/timeslots/available
// @access  Private/Admin
exports.getAvailableTimeslots = asyncHandler(async (req, res) => {
    const timeslots = await Timeslot.find({ isFilled: false })
        .populate('panelist', 'name email role')
        .sort({ startTime: 1 });

    res.json(timeslots);
});

// @desc    Create a panel with 3 members (1 alumni + 2 volunteers)
// @route   POST /api/panels/create
// @access  Private/Admin
exports.createPanel = asyncHandler(async (req, res) => {
    const { memberIds, timeslotId, meetingLink } = req.body;

    // Verify all members exist and have correct roles
    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length !== 3) {
        res.status(400);
        throw new Error('Panel must have exactly 3 members');
    }

    const alumniCount = members.filter(m => m.role === 'alumni').length;
    const volunteerCount = members.filter(m => m.role === 'volunteer').length;

    if (alumniCount !== 1 || volunteerCount !== 2) {
        res.status(400);
        throw new Error('Panel must have 1 alumni and 2 volunteers');
    }

    // Check if timeslot exists and is available
    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot || timeslot.isFilled) {
        res.status(400);
        throw new Error('Timeslot not available');
    }

    // Create panel
    const panel = await Panel.create({
        members: memberIds,
        timeslot: timeslotId,
        meetingLink: meetingLink || `https://meet.google.com/kk-panel-${Date.now()}`,
    });

    // Mark timeslot as filled
    timeslot.isFilled = true;
    await timeslot.save();

    // Notify panel members
    for (const member of members) {
        await NotificationService.sendEmail(
            member.email,
            'Panel Interview Assignment - Karpom Karpippom',
            `You have been assigned to a panel interview. Please check your dashboard for details.`,
            `<h1>Panel Interview Assignment</h1>
             <p>You have been assigned to a panel interview scheduled for ${timeslot.startTime}.</p>
             <p>Meeting Link: ${panel.meetingLink}</p>`
        );
    }

    res.status(201).json({
        message: 'Panel created successfully',
        panel: await panel.populate('members', 'name email role')
    });
});

// @desc    Create a batch of students for a panel
// @route   POST /api/panels/batches
// @access  Private/Admin
exports.createBatch = asyncHandler(async (req, res) => {
    const { studentIds, panelId } = req.body;

    // Verify panel exists
    const panel = await Panel.findById(panelId).populate('members');
    if (!panel) {
        res.status(404);
        throw new Error('Panel not found');
    }

    // Verify all students exist
    const students = await Application.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
        res.status(400);
        throw new Error('Some students not found');
    }

    // Create batch
    const batch = await Batch.create({
        students: studentIds,
        panel: panelId,
    });

    // Update panel with batch
    panel.batch = batch._id;
    await panel.save();

    // Notify students
    for (const studentId of studentIds) {
        const student = await Application.findById(studentId);
        await NotificationService.sendEmail(
            student.email,
            'Panel Interview Scheduled - Karpom Karpippom',
            `Your panel interview has been scheduled. Please check your dashboard for details.`,
            `<h1>Panel Interview Scheduled</h1>
             <p>Your panel interview has been scheduled for ${panel.timeslot.startTime}.</p>
             <p>Meeting Link: ${panel.meetingLink}</p>`
        );
    }

    res.status(201).json({
        message: 'Batch created and students notified',
        batch: await batch.populate('students', 'name email applicationId')
    });
});

// @desc    Submit interview evaluation
// @route   POST /api/panels/evaluations
// @access  Private/Panel Member
exports.submitEvaluation = asyncHandler(async (req, res) => {
    const { applicationId, panelId, evaluation, recommendation, comments } = req.body;

    // Verify panel membership
    const panel = await Panel.findById(panelId);
    if (!panel || !panel.members.includes(req.user.id)) {
        res.status(403);
        throw new Error('Not authorized to evaluate for this panel');
    }

    // Create evaluation
    const interviewEvaluation = await InterviewEvaluation.create({
        application: applicationId,
        panel: panelId,
        evaluation,
        recommendation,
        comments,
    });

    res.status(201).json({
        message: 'Evaluation submitted successfully',
        evaluation: interviewEvaluation
    });
});

// @desc    Get all panels
// @route   GET /api/panels
// @access  Private/Admin
exports.getPanels = asyncHandler(async (req, res) => {
    const panels = await Panel.find({})
        .populate('members', 'name email role')
        .populate('timeslot')
        .populate('batch')
        .sort({ createdAt: -1 });

    res.json(panels);
});

// @desc    Get panel by ID
// @route   GET /api/panels/:id
// @access  Private/Panel Member
exports.getPanelById = asyncHandler(async (req, res) => {
    const panel = await Panel.findById(req.params.id)
        .populate('members', 'name email role')
        .populate('timeslot')
        .populate({
            path: 'batch',
            populate: {
                path: 'students',
                select: 'name email applicationId'
            }
        });

    if (!panel) {
        res.status(404);
        throw new Error('Panel not found');
    }

    // Check if user is a panel member
    if (!panel.members.some(member => member._id.toString() === req.user.id)) {
        res.status(403);
        throw new Error('Not authorized to view this panel');
    }

    res.json(panel);
});

// @desc    Get all evaluations for a panel
// @route   GET /api/panels/:id/evaluations
// @access  Private/Panel Member
exports.getPanelEvaluations = asyncHandler(async (req, res) => {
    const evaluations = await InterviewEvaluation.find({ panel: req.params.id })
        .populate('application', 'name email applicationId')
        .populate('panel', 'members');

    res.json(evaluations);
});

module.exports = {
    registerTimeslot,
    getAvailableTimeslots,
    createPanel,
    createBatch,
    submitEvaluation,
    getPanels,
    getPanelById,
    getPanelEvaluations
};