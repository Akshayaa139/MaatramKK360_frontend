const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const ClassSession = require("../models/ClassSession");

// @desc    Get students pending panel interview
// @route   GET /api/students/pending-panel
// @access  Private/Admin
const getStudentsPendingPanel = asyncHandler(async (req, res) => {
  const applications = await require("../models/Application")
    .find({ status: { $in: ["tele_verification", "panel_interview"] } })
    .select("applicationNumber personalInfo educationalInfo status");
  const result = applications.map((a) => ({
    id: String(a._id),
    name: a.personalInfo?.fullName || a.name || "Student",
    applicationStatus: a.status || "tele_verification",
  }));
  res.json(result);
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const student = await Student.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone"
  );
  if (!student) {
    // Return user info even if student profile is not yet created/linked
    return res.json({ user, student: null });
  }
  res.json({ user, student });
});

const getMyClasses = asyncHandler(async (req, res) => {
  console.log("getMyClasses called for user:", req.user._id);
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    console.log("Student profile not found for user:", req.user._id);
    return res.json([]); // Return empty classes list
  }
  console.log("Found student:", student._id);

  // ORIGINAL: 
  // const classes = await Class.find({ students: student._id }).populate({...});

  // NEW: Find classes where student is enrolled OR class belongs to mapped tutor (and subject matches)
  const query = {
    $or: [{ students: student._id }],
  };

  if (student.tutor) {
    // If mapped to a tutor, also include their classes (relaxed: show all tutor classes)
    query.$or.push({ tutor: student.tutor });
  }

  const classes = await Class.find(query).populate({
    path: "tutor",
    populate: { path: "user", select: "name email phone" },
  });

  console.log("Found classes count:", classes.length);

  // Check for live sessions for these classes
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

  const result = classes.map((c) => ({
    id: c._id,
    title: c.title,
    subject: c.subject,
    schedule: c.schedule,
    status: c.status,
    isLive: liveClassIds.has(String(c._id)),
    sessionLink: c.sessionLink,
    recordingLink: c.recordingLink,
    notesLink: c.notesLink,
    isEnrolled: c.students.some(s => String(s) === String(student._id)),
    tutor: {
      id: c.tutor?._id,
      name: c.tutor?.user?.name || "",
      email: c.tutor?.user?.email || "",
      phone: c.tutor?.user?.phone || "",
    },
  }));
  // Fetch Panels for this student
  const Panel = require("../models/Panel");
  const panels = await Panel.find({})
    .populate({
      path: "batch",
      match: { students: student._id }
    })
    .populate("members", "name email role")
    .populate("timeslot");

  // Filter out panels where batch is null (student not in batch)
  const myPanels = panels.filter(p => p.batch);

  const panelSessions = myPanels.map(p => ({
    id: p._id,
    title: "Panel Interview",
    subject: "Interview",
    schedule: {
      day: p.timeslot ? new Date(p.timeslot.startTime).toLocaleDateString("en-US", { weekday: 'long' }) : "",
      startTime: p.timeslot ? new Date(p.timeslot.startTime).toLocaleTimeString() : "",
      endTime: p.timeslot ? new Date(p.timeslot.endTime).toLocaleTimeString() : ""
    },
    status: "upcoming",
    sessionLink: p.meetingLink,
    tutor: {
      id: p.members[0]?._id, // Just pick first member for display
      name: "Panel: " + p.members.map(m => m.name).join(", "),
      email: "",
      phone: ""
    }
  }));

  const combined = [...result, ...panelSessions];
  res.json(combined);
});

// @desc    Get aggregated performance by exam type
// @route   GET /api/students/performance
// @access  Private/Student
const getMyPerformance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.json({
      mid: 0,
      quarterly: 0,
      half: 0,
      final: 0,
    });
  }
  const perf = student.performance || [];
  const agg = {};
  for (const p of perf) {
    const type = p.examType || "other";
    if (!agg[type]) agg[type] = { total: 0, max: 0, count: 0 };
    agg[type].total += p.score;
    agg[type].max += p.maxScore;
    agg[type].count += 1;
  }
  const toPct = (o) =>
    o.count ? Math.round((o.total / o.max) * 100 * 100) / 100 : 0;
  res.json({
    mid: toPct(agg["mid"] || { total: 0, max: 0, count: 0 }),
    quarterly: toPct(agg["quarterly"] || { total: 0, max: 0, count: 0 }),
    half: toPct(agg["half"] || { total: 0, max: 0, count: 0 }),
    final: toPct(agg["final"] || { total: 0, max: 0, count: 0 }),
  });
});

// @desc    Get aggregated student progress metrics (attendance %, test avg %, trend, composite growth)
// @route   GET /api/students/progress
// @access  Private/Student
const getMyProgress = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return res.json({
      attendanceRate: 0,
      testAveragePercent: 0,
      testTrendPercent: 0,
      compositeGrowth: 0,
    });
  }

  // attendance % (present / (present + absent))
  const attendance = Array.isArray(student.attendance)
    ? student.attendance
    : [];
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const attendanceDenom = presentCount + absentCount;
  const attendanceRate = attendanceDenom
    ? Math.round((presentCount / attendanceDenom) * 100)
    : 0;

  // overall test average percent from student.performance
  const perf = Array.isArray(student.performance) ? student.performance : [];
  let totalScore = 0,
    totalMax = 0;
  for (const p of perf) {
    totalScore += Number(p.score || 0);
    totalMax += Number(p.maxScore || 0) || 0;
  }
  const testAveragePercent = totalMax
    ? Math.round((totalScore / totalMax) * 100)
    : 0;

  // compute simple trend: compare average of last 3 tests vs previous 3 tests
  const perfSorted = perf
    .slice()
    .sort((a, b) => new Date(a.testDate || 0) - new Date(b.testDate || 0));
  const last3 = perfSorted.slice(-3);
  const prev3 = perfSorted.slice(-6, -3);
  const avg = (arr) => {
    if (!arr || arr.length === 0) return null;
    let s = 0,
      m = 0;
    for (const r of arr) {
      s += Number(r.score || 0);
      m += Number(r.maxScore || 0) || 0;
    }
    return m ? (s / m) * 100 : null;
  };
  const recentAvg = avg(last3);
  const prevAvg = avg(prev3);
  let testTrendPercent = null;
  if (recentAvg !== null && prevAvg !== null && prevAvg !== 0) {
    testTrendPercent =
      Math.round(((recentAvg - prevAvg) / prevAvg) * 100 * 100) / 100;
  } else if (recentAvg !== null && prevAvg === null) {
    testTrendPercent = null; // not enough history
  }

  // composite growth: weighted (tests 70%, attendance 30%) using available values
  const compositeGrowth =
    Math.round((0.7 * testAveragePercent + 0.3 * attendanceRate) * 100) / 100;

  res.json({
    attendanceRate,
    testAveragePercent,
    testTrendPercent,
    compositeGrowth,
  });
});

// @desc    Get notification counts (assignments/tests due)
// @route   GET /api/students/notifications
// @access  Private/Student
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const getStudentNotifications = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.json({ assignments: 0 });

  // Find all classes the student is enrolled in
  const classes = await Class.find({ students: student._id }).select('_id');
  const classIds = classes.map(c => c._id);

  // Count active assignments not submitted by this student
  // Note: This logic assumes if not in submissions array, it's not submitted.
  // A improved check would be to see if submission exists for this student.
  const assignments = await Assignment.find({
    class: { $in: classIds },
    dueDate: { $gte: new Date() }, // Only count future/current assignments
    'submissions.student': { $ne: student._id } // Not submitted by student
  }).countDocuments();

  res.json({ assignments });
});

// @desc    Get all tutors for student selection
// @route   GET /api/students/tutors
// @access  Private/Student
const getTutors = asyncHandler(async (req, res) => {
  console.log("getTutors API called by user:", req.user._id);
  const Tutor = require("../models/Tutor");
  const tutors = await Tutor.find({}).populate("user", "name email phone");
  console.log("Found tutors count:", tutors.length);
  res.json(tutors);
});

module.exports = {
  getStudentsPendingPanel,
  getStudentProfile,
  getMyClasses,
  getMyPerformance,
  getMyProgress,
  getStudentNotifications,
  getTutors,
};
