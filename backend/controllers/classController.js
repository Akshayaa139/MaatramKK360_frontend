const Class = require("../models/Class");
const Tutor = require("../models/Tutor");
const Student = require("../models/Student");
// helper: normalize strings for comparisons
const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

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

    res.json(classes);
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

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getTutorClasses, getAllClasses };
// @desc    Update schedule for a class (tutor)
// @route   PUT /api/classes/:classId/schedule
// @access  Private/Tutor
const updateClassSchedule = async (req, res) => {
  try {
    const { classId } = req.params;
    const { day, startTime, endTime, status } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor || String(cls.tutor) !== String(tutor._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (day && startTime && endTime) {
      cls.schedule = { day, startTime, endTime };
      if (cls.status === "scheduled") cls.status = "rescheduled";
    }
    if (status) cls.status = status;
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
    res.json({ message: "Class started", sessionLink: cls.sessionLink });
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
    const { title, subject, description, day, startTime, endTime } = req.body;

    // Basic validation
    if (!title || !subject || !day || !startTime || !endTime) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const newClass = new Class({
      tutor: tutor._id,
      title,
      subject,
      description: description || "",
      schedule: {
        day,
        startTime,
        endTime
      },
      students: [], // Initially empty
      status: 'scheduled'
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getTutorClasses, getAllClasses, updateClassSchedule, startClassSession, createClass };
