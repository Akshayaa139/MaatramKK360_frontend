const asyncHandler = require('express-async-handler');
const MentoringSession = require('../models/MentoringSession');
const Tutor = require('../models/Tutor');

// @desc    Get all mentoring sessions (for tutor or student)
// @route   GET /api/mentoring/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
    let query = {};
    const role = req.user.role;

    if (role === 'tutor') {
        const tutor = await Tutor.findOne({ user: req.user._id });
        if (!tutor) {
            res.status(404);
            throw new Error('Tutor not found');
        }
        query = { tutor: tutor._id };
    } else if (role === 'student') {
        const student = await require('../models/Student').findOne({ user: req.user._id });
        if (!student) {
            console.warn(`Student profile not found for user ${req.user._id}`);
            return res.json([]);
        }
        query = { students: student._id };
    } else {
        res.status(403);
        throw new Error('Unauthorized role');
    }

    const sessions = await MentoringSession.find(query)
        .populate('tutor', 'user')
        .populate({
            path: 'tutor',
            populate: { path: 'user', select: 'name email' }
        })
        .populate('students', 'user grade')
        .populate({
            path: 'students',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ date: -1 });
    res.json(sessions);
});

// @desc    Create new mentoring session
// @route   POST /api/mentoring
// @access  Private/Tutor
const createSession = asyncHandler(async (req, res) => {
    const { title, topic, date, startTime, duration, students, notes } = req.body;

    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
        res.status(404);
        throw new Error('Tutor not found');
    }

    const session = await MentoringSession.create({
        tutor: tutor._id,
        students: students === 'all' ? tutor.assignedStudents : (Array.isArray(students) ? students : [students]),
        title,
        topic,
        date,
        startTime,
        duration,
        notes
    });

    res.status(201).json(session);
});

// @desc    Get all mentoring sessions for tutor (including requests)
const getMentoringRequests = asyncHandler(async (req, res) => {
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
        res.status(404);
        throw new Error('Tutor not found');
    }
    const requests = await MentoringSession.find({
        tutor: tutor._id,
        status: { $in: ['pending', 'approved', 'rejected'] }
    }).populate({
        path: 'requestedBy',
        populate: { path: 'user', select: 'name email' }
    }).sort({ createdAt: -1 });
    res.json(requests);
});

// @desc    Request a mentoring session (Student)
const requestSession = asyncHandler(async (req, res) => {
    const { tutorId, title, topic, date, startTime, duration, message } = req.body;

    const student = await require('../models/Student').findOne({ user: req.user._id });
    if (!student) {
        return res.status(400).json({ message: 'Student profile not found. Please complete your profile first.' });
    }

    const session = await MentoringSession.create({
        tutor: tutorId,
        requestedBy: student._id,
        students: [student._id],
        title,
        topic,
        date,
        startTime,
        duration,
        message,
        status: 'pending'
    });

    res.status(201).json(session);
});

// @desc    Approve/Reject request
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const session = await MentoringSession.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Request not found');
    }

    session.status = status;
    if (status === 'approved') {
        session.status = 'scheduled'; // Move to scheduled
    }
    await session.save();
    res.json(session);
});

const cancelSession = asyncHandler(async (req, res) => {
    const session = await MentoringSession.findById(req.params.id);
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    session.status = 'cancelled';
    await session.save();
    res.json(session);
});

module.exports = {
    getSessions,
    createSession,
    cancelSession,
    requestSession,
    getMentoringRequests,
    updateRequestStatus
};
