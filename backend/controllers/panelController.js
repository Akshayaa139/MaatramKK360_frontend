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

// @desc    Admin creates a timeslot for a specific panelist
// @route   POST /api/panels/timeslots/admin
// @access  Private/Admin
exports.createTimeslotAdmin = asyncHandler(async (req, res) => {
    const { panelistId, startTime, endTime } = req.body;
    if (!panelistId || !startTime || !endTime) {
        res.status(400);
        return res.status(400).json({ message: 'panelistId, startTime and endTime are required' });
    }
    const panelist = await User.findById(panelistId);
    if (!panelist) {
        return res.status(404).json({ message: 'Panelist not found' });
    }

    const allowedRoles = ['volunteer', 'alumni', 'tutor', 'admin'];
    if (!allowedRoles.includes((panelist.role || '').toLowerCase())) {
        return res.status(400).json({ message: 'Panelist must be a volunteer, alumni, tutor, or admin' });
    }
    const timeslot = await Timeslot.create({
        panelist: panelistId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isFilled: false
    });
    res.status(201).json({ message: 'Timeslot created', timeslot });
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
    if (members.length < 3 || members.length > 4) {
        res.status(400);
        throw new Error('Panel must have 3 or 4 members');
    }

    // Expected composition:
    // 1. Classic: 1 alumni + 2 volunteers
    // 2. Tutor Panel: 3 tutors
    // 3. Admin Mixed: Contains at least one admin
    const alumniCount = members.filter(m => (m.role || '').toLowerCase() === 'alumni').length;
    const volunteerCount = members.filter(m => (m.role || '').toLowerCase() === 'volunteer').length;
    const tutorCount = members.filter(m => (m.role || '').toLowerCase() === 'tutor').length;
    const adminCount = members.filter(m => (m.role || '').toLowerCase() === 'admin').length;

    const isAlumniVolunteerPanel = alumniCount === 1 && volunteerCount === 2 && members.length === 3;
    const isAllTutorsPanel = tutorCount === 3 && members.length === 3;
    const isAdminPanel = adminCount >= 1; // Flexible composition if admin is present

    if (!(isAlumniVolunteerPanel || isAllTutorsPanel || isAdminPanel)) {
        return res.status(400).json({ message: 'Invalid panel composition. Must be (1 Alumni + 2 Volunteers), (3 Tutors), or include an Admin.' });
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
        meetingLink: meetingLink || `https://meet.jit.si/kk-panel-${Date.now()}`,
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
             <p>Meeting Link: ${panel.meetingLink}</p>`,
            'admin'
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
             <p>Meeting Link: ${panel.meetingLink}</p>`,
            'students'
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

    if (recommendation) {
        const app = await Application.findById(applicationId);
        if (app) {
            if (recommendation.toLowerCase().includes('recommend')) {
                app.status = 'selected';
                try {
                    const student = await (async () => {
                        const email = app.personalInfo?.email || app.email;
                        let user = await require('../models/User').findOne({ email });
                        if (!user) user = await require('../models/User').create({ name: app.personalInfo?.fullName || app.name || 'Student', email, password: 'Welcome@123', role: 'student', phone: app.personalInfo?.phone || app.phone });
                        let student = await require('../models/Student').findOne({ user: user._id });
                        if (!student) {
                            const educational = app.educationalInfo || {};
                            const subjects = Array.isArray(educational.subjects) ? educational.subjects.map(x => x?.name || x) : [];
                            student = await require('../models/Student').create({ user: user._id, grade: educational.currentClass || 'Unknown', subjects });
                        }
                        return student;
                    })();
                    const Panel = require('../models/Panel');
                    const Timeslot = require('../models/Timeslot');
                    const panel = await Panel.findById(panelId).populate('timeslot');
                    const slot = panel?.timeslot ? await Timeslot.findById(panel.timeslot) : null;
                    const slotDay = slot ? new Date(slot.startTime).toLocaleDateString('en-US', { weekday: 'long' }) : null;
                    const slotStartHM = slot ? new Date(slot.startTime).toTimeString().slice(0, 5) : null;

                    // Refactored: Multi-subject assignment loop
                    const educational = app.educationalInfo || {};
                    const subjects = Array.isArray(educational.subjects) ? educational.subjects.map(x => x?.name || x) : [];
                    const Tutor = require('../models/Tutor');
                    const Class = require('../models/Class');

                    // Iterate each subject to assign best tutor
                    for (const subject of subjects) {
                        // 1. Find eligible tutors for this specific subject
                        let tutors = await Tutor.find({ subjects: subject, status: { $in: ['active', 'pending'] } });

                        // 2. Filter by slot match (if slot exists)
                        if (slotDay && slotStartHM) {
                            const hmToMinutes = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
                            const slotStartMin = hmToMinutes(slotStartHM);
                            tutors = tutors.filter(t => (t.availability || []).some(a => a.day === slotDay && hmToMinutes(a.startTime) <= slotStartMin && slotStartMin < hmToMinutes(a.endTime)));
                        }

                        if (tutors.length > 0) {
                            // 3. Load Balancing
                            const tutorsWithLoad = await Promise.all(tutors.map(async (t) => {
                                const count = await Class.countDocuments({ tutor: t._id, status: { $ne: 'completed' } });
                                return { ...t.toObject(), load: count };
                            }));

                            // Sort: Load ASC, Exp DESC
                            tutorsWithLoad.sort((a, b) => {
                                if (a.load !== b.load) return a.load - b.load;
                                return (b.experienceYears || 0) - (a.experienceYears || 0);
                            });

                            const teacher = tutorsWithLoad[0];
                            const tutor = teacher ? await Tutor.findById(teacher._id).populate('user') : null;

                            if (tutor) {
                                const avail = Array.isArray(tutor.availability) ? tutor.availability : [];
                                const sched = slotDay ? (avail.find(a => a.day === slotDay) || avail[0]) : (avail[0] || { day: 'Monday', startTime: '18:00', endTime: '19:00' });

                                // Check existing class for this subject
                                const existing = await Class.findOne({
                                    students: student._id,
                                    subject: subject
                                });

                                if (!existing) {
                                    const cls = await Class.create({
                                        title: `${subject} - ${student.user}`,
                                        subject: subject,
                                        tutor: tutor._id,
                                        students: [student._id],
                                        schedule: { day: sched.day, startTime: sched.startTime, endTime: sched.endTime },
                                        status: 'scheduled',
                                        sessionLink: `https://meet.jit.si/KK360-${subject.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
                                    });
                                    // Keep at least one assignment for reference
                                    if (!app.tutorAssignment || !app.tutorAssignment.tutor) {
                                        app.tutorAssignment = { tutor: tutor._id, meetingLink: cls.sessionLink, schedule: cls.schedule };
                                    }
                                }
                            }
                        }
                    } // end subject loop
                } catch { }
            } else if (recommendation.toLowerCase().includes('do not')) {
                app.status = 'rejected';
            }
            await app.save();
        }
    }

    res.status(201).json({
        message: 'Evaluation submitted successfully',
        evaluation: interviewEvaluation
    });
});

// @desc    Get all panels
// @route   GET /api/panels
// @access  Private/Admin
exports.getPanels = asyncHandler(async (req, res) => {
    console.log("[DEBUG] getPanels called");
    const panels = await Panel.find({})
        .populate('members', 'name email role')
        .populate('timeslot')
        .populate('batch')
        .sort({ createdAt: -1 });

    console.log(`[DEBUG] Found ${panels.length} panels`);
    // Log first panel if exists to see sample data
    if (panels.length > 0) {
        console.log(`[DEBUG] Sample panel members: ${panels[0].members?.length || 0}`);
        console.log(`[DEBUG] Sample panel timeslot: ${panels[0].timeslot ? 'Exists' : 'Missing'}`);
    }

    res.json(panels);
});

// @desc    Get all panels (alias for admin routes)
// @route   GET /api/admin/panels
// @access  Private/Admin
exports.getAllPanels = exports.getPanels;

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

// @desc    Update panel
// @route   PUT /api/admin/panels/:id
// @access  Private/Admin
exports.updatePanel = asyncHandler(async (req, res) => {
    const { meetingLink, status } = req.body;

    const panel = await Panel.findById(req.params.id);

    if (!panel) {
        res.status(404);
        throw new Error('Panel not found');
    }

    if (meetingLink) panel.meetingLink = meetingLink;
    if (status) panel.status = status;

    await panel.save();

    res.json({
        message: 'Panel updated successfully',
        panel: await panel.populate('members', 'name email role')
    });
});

// @desc    Delete panel
// @route   DELETE /api/admin/panels/:id
// @access  Private/Admin
exports.deletePanel = asyncHandler(async (req, res) => {
    const panel = await Panel.findById(req.params.id);

    if (!panel) {
        res.status(404);
        throw new Error('Panel not found');
    }

    // Free up the timeslot if it exists
    if (panel.timeslot) {
        const timeslot = await Timeslot.findById(panel.timeslot);
        if (timeslot) {
            timeslot.isFilled = false;
            await timeslot.save();
        }
    }

    await panel.deleteOne();

    res.json({
        message: 'Panel deleted successfully'
    });
});

// @desc    Assign panelists to a panel
// @route   POST /api/admin/panels/:id/assign-panelists
// @access  Private/Admin
exports.assignPanelists = asyncHandler(async (req, res) => {
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length !== 3) {
        res.status(400);
        throw new Error('Panel must have exactly 3 members');
    }

    const panel = await Panel.findById(req.params.id);

    if (!panel) {
        res.status(404);
        throw new Error('Panel not found');
    }

    // Verify all members exist and have correct roles
    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length < 3 || members.length > 4) {
        res.status(400);
        throw new Error('Panel must have 3 or 4 members');
    }

    const alumniCount = members.filter(m => (m.role || '').toLowerCase() === 'alumni').length;
    const volunteerCount = members.filter(m => (m.role || '').toLowerCase() === 'volunteer').length;
    const tutorCount = members.filter(m => (m.role || '').toLowerCase() === 'tutor').length;
    const adminCount = members.filter(m => (m.role || '').toLowerCase() === 'admin').length;

    const isAlumniVolunteerPanel = alumniCount === 1 && volunteerCount === 2 && members.length === 3;
    const isAllTutorsPanel = tutorCount === 3 && members.length === 3;
    const isAdminPanel = adminCount >= 1;

    if (!(isAlumniVolunteerPanel || isAllTutorsPanel || isAdminPanel)) {
        res.status(400);
        throw new Error('Invalid panel composition.');
    }

    panel.members = memberIds;
    await panel.save();

    // Notify panel members
    for (const member of members) {
        await NotificationService.sendEmail(
            member.email,
            'Panel Assignment Updated - Karpom Karpippom',
            `You have been assigned to a panel interview. Please check your dashboard for details.`,
            `<h1>Panel Assignment Updated</h1>
             <p>You have been assigned to a panel interview.</p>
             <p>Meeting Link: ${panel.meetingLink || 'To be announced'}</p>`
        );
    }

    res.json({
        message: 'Panelists assigned successfully',
        panel: await panel.populate('members', 'name email role')
    });
});

// @desc    Get panel analytics
// @route   GET /api/admin/panels/analytics
// @access  Private/Admin
exports.getPanelAnalytics = asyncHandler(async (req, res) => {
    // Get panels by status
    const statusStats = await Panel.aggregate([
        {
            $group: {
                _id: { $ifNull: ['$status', 'active'] },
                count: { $sum: 1 }
            }
        }
    ]);

    // Get total panels
    const totalPanels = await Panel.countDocuments();

    // Get panels with batches
    const panelsWithBatches = await Panel.countDocuments({ batch: { $exists: true, $ne: null } });

    // Get evaluations count
    const totalEvaluations = await InterviewEvaluation.countDocuments();

    // Get panels created over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeSeriesStats = await Panel.aggregate([
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
        totalPanels,
        panelsWithBatches,
        totalEvaluations,
        timeSeriesStats
    });
});
// @desc    Get panels assigned to current volunteer/alumni
// @route   GET /api/panels/mine
// @access  Private/Volunteer
exports.getMyPanels = asyncHandler(async (req, res) => {
    const panels = await Panel.find({ members: req.user._id })
        .populate('members', 'name email role')
        .populate('timeslot')
        .populate({ path: 'batch', populate: { path: 'students', select: 'applicationId personalInfo email' } })
        .sort({ createdAt: -1 });
    res.json(panels);
});
