const Class = require("../models/Class");
const Tutor = require("../models/Tutor");
const Student = require("../models/Student");
const ClassSession = require("../models/ClassSession");
// helper: normalize strings for comparisons
const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(date);
  return days[d.getDay()];
};

// @desc    Get all classes for a specific tutor
// @route   GET /api/classes/tutor
// @access  Private
const getTutorClasses = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
      return res.json([]);
    }

    // Fetch classes and populate students
    const classes = await Class.find({ tutor: tutor._id })
      .populate({
        path: "students",
        populate: { path: "user", select: "name email" },
      })
      .sort({ "schedule.day": 1, "schedule.startTime": 1 }); // Optional: sort by day/time

    // Check for live sessions
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const liveSessions = await ClassSession.find({
      class: { $in: classes.map(c => c._id) },
      endTime: null,
      $or: [
        { lastHeartbeat: { $gte: twoMinutesAgo } },
        { startTime: { $gte: twoMinutesAgo } }
      ]
    });
    const liveClassIds = new Set(liveSessions.map(s => String(s.class)));

    const result = classes.map(c => {
      const obj = c.toObject();
      obj.isLive = liveClassIds.has(String(c._id));
      return obj;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({})
      .populate({
        path: "tutor",
        populate: { path: "user", select: "name email" },
      })
      .populate("students");

    // Check for live sessions
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const liveSessions = await ClassSession.find({
      class: { $in: classes.map(c => c._id) },
      endTime: null,
      $or: [
        { lastHeartbeat: { $gte: twoMinutesAgo } },
        { startTime: { $gte: twoMinutesAgo } }
      ]
    });
    const liveClassIds = new Set(liveSessions.map(s => String(s.class)));

    const result = classes.map(c => {
      const obj = c.toObject();
      obj.isLive = liveClassIds.has(String(c._id));
      return obj;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update schedule for a class (tutor)
// @route   PUT /api/classes/:classId/schedule
// @access  Private/Tutor
const updateClassSchedule = async (req, res) => {
  try {
    const { classId } = req.params;
    const { day, date, startTime, endTime, status } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor || String(cls.tutor) !== String(tutor._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if ((day || date) && startTime && endTime) {
      const finalDay = date ? getDayName(date) : day;
      cls.schedule = { day: finalDay, date: date || null, startTime, endTime };
      if (cls.status === "scheduled") cls.status = "rescheduled";
    }
    if (status) cls.status = status;
    if (req.body.recordingLink !== undefined) cls.recordingLink = req.body.recordingLink;
    if (req.body.notesLink !== undefined) cls.notesLink = req.body.notesLink;

    await cls.save();
    res.json({ message: "Schedule updated", class: cls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports.updateClassSchedule = updateClassSchedule;

// @desc    Start class session: generate meeting link and init attendance
// @route   POST /api/classes/:classId/start
// @access  Private/Tutor
const startClassSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const { sessionLink } = req.body; // Accept link from client

    const cls = await Class.findById(classId).populate("students");
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor || String(cls.tutor) !== String(tutor._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update link if provided.
    if (sessionLink) {
      cls.sessionLink = sessionLink;
    }

    // Auto-generate Jitsi link if missing OR if it's the old invalid Google Meet link
    // Invalid pattern: https://meet.google.com/kk-class-
    const isInvalidLink = cls.sessionLink && cls.sessionLink.includes("meet.google.com/kk-class-");

    if (!cls.sessionLink || isInvalidLink) {
      // Create a valid, unique Jitsi Meet URL
      // Format: KK360-<Subject>-<ClassID>
      const cleanSubject = norm(cls.subject).replace(/[^a-z0-9]/g, "");
      cls.sessionLink = `https://meet.jit.si/KK360-${cleanSubject}-${cls._id}`;
    }
    // Propagate same meeting link to all classes for this tutor+subject
    const allForTutor = await Class.find({ tutor: cls.tutor });
    const sameSubjectClasses = allForTutor.filter(
      (c) => norm(c.subject) === norm(cls.subject)
    );
    for (const c of sameSubjectClasses) {
      if (!c.sessionLink || c.sessionLink !== cls.sessionLink) {
        c.sessionLink = cls.sessionLink;
        await c.save();
      }
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const allStudentIds = Array.from(
      new Set(
        sameSubjectClasses.flatMap((c) =>
          (c.students || []).map((s) => String(s))
        )
      )
    );
    for (const sid of allStudentIds) {
      const studentId = sid;
      const matched = await Student.findOne({
        _id: studentId,
        attendance: {
          $elemMatch: {
            class: cls._id,
            date: { $gte: todayStart, $lt: todayEnd },
          },
        },
      });
      if (!matched) {
        await Student.updateOne(
          { _id: studentId },
          {
            $push: {
              attendance: {
                class: cls._id,
                status: "absent",
                date: new Date(),
              },
            },
          }
        );
      }
    }
    await cls.save();

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const existingSession = await ClassSession.findOne({
      class: cls._id,
      endTime: null,
      startTime: { $gte: threeHoursAgo }
    });

    if (existingSession) {
      // If we have an active session, ensure the link matches (just in case)
      if (existingSession.sessionLink && existingSession.sessionLink !== cls.sessionLink) {
        cls.sessionLink = existingSession.sessionLink;
        await cls.save();
      }
      return res.json({
        message: "Class session already active",
        sessionLink: cls.sessionLink,
        sessionId: existingSession._id,
        class: cls
      });
    }

    // Log the session start
    const session = await ClassSession.create({
      class: cls._id,
      tutor: tutor._id,
      startTime: new Date(),
      sessionLink: cls.sessionLink,
      expectedStudents: cls.students // Snapshot of students assigned at start time
    });

    res.json({ message: "Class started", sessionLink: cls.sessionLink, sessionId: session._id, class: cls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Tutor
const createClass = async (req, res) => {
  try {
    const { title, subject, description, day, date, startTime, endTime, students } = req.body;

    const finalDay = date ? getDayName(date) : day;

    // Basic validation
    if (!title || !subject || !finalDay || !startTime || !endTime) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const tutor = await Tutor.findOne({ user: req.user._id }).populate('user');
    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Use provided students list or empty
    const studentList = Array.isArray(students) ? students : [];

    // Robust Title generation if generic
    let finalTitle = title;

    // Generate unique link
    const slug = norm(subject).replace(/[^a-z0-9]/g, "");
    const sessionLink = `https://meet.jit.si/KK360-${slug}-${Date.now()}`;

    const newClass = new Class({
      tutor: tutor._id,
      title: finalTitle,
      subject,
      description: description || "",
      schedule: {
        day: finalDay,
        date: date || null,
        startTime,
        endTime
      },
      students: studentList,
      status: 'scheduled',
      sessionLink
    });

    const savedClass = await newClass.save();

    // IMPORTANT: If we added students, we should ensure they have this in their attendance/progress or at least be aware?
    // The Class model is the source of truth for "Students in Class", so saving `students` array is sufficient for visibility.

    res.status(201).json(savedClass);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Log session event (join/leave)
// @route   POST /api/classes/session/:sessionId/log
// @access  Private
const logSessionEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body; // 'join' or 'leave'

    if (!['join', 'leave'].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Add log entry
    session.logs.push({
      user: req.user._id,
      role: req.user.role,
      action,
      timestamp: new Date()
    });

    // Update active count
    if (action === 'join') {
      session.activeParticipants = (session.activeParticipants || 0) + 1;
    } else if (action === 'leave') {
      session.activeParticipants = Math.max(0, (session.activeParticipants || 0) - 1);

      // If tutor leaves, mark the session as ended
      if (req.user.role === 'tutor') {
        session.endTime = new Date();
      }
    }

    await session.save();
    res.json({ message: "Event logged", activeParticipants: session.activeParticipants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update session heartbeat
// @route   POST /api/classes/session/:sessionId/heartbeat
// @access  Private
const sendHeartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await ClassSession.findByIdAndUpdate(sessionId, { lastHeartbeat: new Date() });
    res.json({ message: "Heartbeat received" });
  } catch (error) {
    res.status(500).json({ message: "Heartbeat failed" });
  }
};

// @desc    Get session history for a specific class
// @route   GET /api/classes/:classId/sessions
// @access  Private (Owner or Admin)
const getClassSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    const sessions = await ClassSession.find({ class: classId })
      .populate('logs.user', 'name role')
      .sort('-startTime');

    // Process sessions to extract attendee list
    const enrichedSessions = sessions.map(s => {
      const logs = (s.logs || []);
      const participants = Array.from(new Set(logs.map(l => l.user?.name || 'Unknown')))
        .filter(name => name !== 'Unknown' && name !== (s.tutor?.user?.name));

      // Separate tutor logs to find tutor start/end
      const tutorLogs = logs.filter(l => l.role === 'tutor');
      const actualStartTime = tutorLogs.find(l => l.action === 'join')?.timestamp || s.startTime;
      const actualEndTime = s.endTime || tutorLogs.filter(l => l.action === 'leave').pop()?.timestamp;

      return {
        _id: s._id,
        startTime: actualStartTime,
        endTime: actualEndTime,
        participants,
        participantCount: participants.length,
        status: actualEndTime ? 'completed' : 'ongoing'
      };
    });

    res.json(enrichedSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};



// @desc    Get live sessions (active > 0)
// @route   GET /api/classes/sessions/live
// @access  Private/Admin
const getLiveSessions = async (req, res) => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const sessions = await ClassSession.find({
      endTime: null,
      $or: [
        { lastHeartbeat: { $gte: twoMinutesAgo } },
        { startTime: { $gte: twoMinutesAgo } }
      ]
    })
      .populate({ path: 'class', select: 'title subject' })
      .populate({ path: 'tutor', populate: { path: 'user', select: 'name' } })
      .sort('-startTime');
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Join class session (get details for student/tutor)
// @route   POST /api/classes/:classId/join
// @access  Private (Student/Tutor)
const joinClassSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Check enrollment
    const isTutor = req.user.role === 'tutor';
    if (!isTutor) {
      // Check if student is enrolled
      const isEnrolled = await Student.exists({ user: req.user._id, classes: classId });
      // Also check if assigned in Class model
      const isInClass = cls.students.includes(req.user._id); // Optimization needed if references differ (User vs Student)

      // Let's rely on Class model 'students' array which contains Student IDs.
      // We need to resolve User -> Student.
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(403).json({ message: "Student profile not found" });

      const isStudentInClass = cls.students.map(s => s.toString()).includes(student._id.toString());

      if (!isStudentInClass) {
        return res.status(403).json({ message: "Not enrolled in this class" });
      }
    }

    // Find the most recent active session (created in last 12 hours) to log against
    const recentSession = await ClassSession.findOne({
      class: classId,
      startTime: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      endTime: null
    }).sort({ startTime: -1 });

    res.json({
      message: "Joined class info",
      sessionLink: cls.sessionLink,
      sessionId: recentSession ? recentSession._id : null,
      class: cls
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getTutorClasses,
  getAllClasses,
  updateClassSchedule,
  startClassSession,
  createClass,
  logSessionEvent,
  sendHeartbeat,
  getLiveSessions,
  joinClassSession,
  getClassSessions
};
