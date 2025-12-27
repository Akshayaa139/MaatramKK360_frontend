const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Application = require("../models/Application");
const Televerification = require("../models/Televerification");
const Panel = require("../models/Panel");
const Batch = require("../models/Batch");
const InterviewEvaluation = require("../models/InterviewEvaluation");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const Tutor = require("../models/Tutor");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const NotificationService = require("../services/notificationService");
const { calculateStudentProgress } = require("../services/studentAnalyticsService");

// --- HELPER FUNCTIONS (Hoisted) ---

const norm = (s) => String(s || "").trim().toLowerCase();

const scheduleEquals = (a, b) => {
  if (!a || !b) return false;
  return (
    norm(a.day) === norm(b.day) &&
    String(a.startTime || "") === String(b.startTime || "") &&
    String(a.endTime || "") === String(b.endTime || "")
  );
};

const scheduleFromTutorAvailability = (tutor) => {
  const avail = Array.isArray(tutor.availability) ? tutor.availability : [];
  // Use first available slot if present
  if (avail.length > 0) return avail[0];

  // Default fallback if no availability
  return {
    day: "Monday",
    startTime: "10:00",
    endTime: "11:00",
  };
};

// helper: check if two time ranges overlap on the same day
const timeRangesOverlap = (slotA, slotB) => {
  if (!slotA || !slotB) return false;
  if (
    String(slotA.day || "")
      .trim()
      .toLowerCase() !==
    String(slotB.day || "")
      .trim()
      .toLowerCase()
  )
    return false;
  const toMinutes = (t) => {
    const [h, m] = String(t || "")
      .split(":")
      .map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  };
  const aStart = toMinutes(slotA.startTime);
  const aEnd = toMinutes(slotA.endTime);
  const bStart = toMinutes(slotB.startTime);
  const bEnd = toMinutes(slotB.endTime);
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
};

// Given a tutor and a list of students, pick the tutor availability slot that covers the most students
const pickBestTutorSlotForStudents = (tutor, students) => {
  const avail = Array.isArray(tutor.availability) ? tutor.availability : [];
  if (!avail.length) return null;
  // students is array of Student docs (may include availability arrays)
  let best = null;
  for (const slot of avail) {
    let count = 0;
    for (const s of students) {
      const sAvail = Array.isArray(s.availability) ? s.availability : [];
      const matches = sAvail.some((sa) => timeRangesOverlap(slot, sa));
      if (matches) count++;
    }
    if (!best || count > best.count) best = { slot, count };
  }
  return best;
};

const createOrFindStudentFromApplication = async (application) => {
  const email = application.personalInfo?.email || application.email;
  let user = await User.findOne({
    $or: [{ email }, { "personalInfo.email": email }],
  });
  if (!user) {
    user = await User.create({
      name: application.personalInfo?.fullName || application.name || "Student",
      email,
      password: "Welcome@123",
      role: "student",
      phone: application.personalInfo?.phone || application.phone,
      isGeneratedFromApplication: true,
      isAccountClaimed: false
    });
  }
  let student = await Student.findOne({ user: user._id });
  if (!student) {
    const educational = application.educationalInfo || {};
    const subjects = Array.isArray(educational.subjects)
      ? educational.subjects.map((x) => x?.name || x)
      : [];
    student = await Student.create({
      user: user._id,
      grade: educational.currentClass || "Unknown",
      subjects,
    });
  }
  return student;
};

const ensureClassForTutorAndStudent = async (
  tutor,
  student,
  subject,
  slot = null
) => {
  const all = await Class.find({ tutor: tutor._id }).populate('tutor'); // Ensure tutor is populated
  let existing = null;

  // Normalize checking
  const normSubject = norm(subject);

  if (slot) {
    existing = all.find(
      (c) =>
        norm(c.subject) === normSubject && scheduleEquals(c.schedule, slot)
    );
  }
  // fallback: match by subject only (legacy behavior)
  if (!existing) existing = all.find((c) => norm(c.subject) === normSubject);

  // Resolve Tutor Name safely
  let tutorName = "Group";
  if (tutor.user && tutor.user.name) {
    tutorName = tutor.user.name;
  } else if (tutor.name) {
    tutorName = tutor.name; // Fallback if name is direct on tutor
  } else if (all.length > 0 && all[0].tutor && all[0].tutor.user && all[0].tutor.user.name) {
    // If tutor doc passed in didn't have user populated, but found classes did
    tutorName = all[0].tutor.user.name;
  }

  if (existing) {
    const already = (existing.students || []).some(
      (s) => String(s) === String(student._id)
    );
    if (!already) {
      existing.students = [...(existing.students || []), student._id];

      // Fix Title if it looks like an ID
      if (!existing.title || / - [0-9a-f]{24}$/i.test(existing.title)) {
        existing.title = `${subject} - ${tutorName}`;
      }

      // Fix Link if missing or generic
      if (!existing.sessionLink || !existing.sessionLink.includes('meet.jit.si')) {
        const slug = normSubject.replace(/[^a-z0-9]/g, "");
        existing.sessionLink = `https://meet.jit.si/KK360-${slug}-${Date.now()}`;
      }

      // if we found a subject-only match but a slot was requested and differs,
      // prefer creating a new class instead of changing existing class schedule
      if (slot && !scheduleEquals(existing.schedule, slot)) {
        // create new class with desired slot
        const slug = normSubject.replace(/[^a-z0-9]/g, "");
        const cls = await Class.create({
          title: `${subject} - ${tutorName}`,
          subject,
          tutor: tutor._id,
          students: [student._id],
          schedule: {
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
          status: "scheduled",
          sessionLink: `https://meet.jit.si/KK360-${slug}-${Date.now()}`,
        });
        return cls;
      }
      await existing.save();
    }
    return existing;
  }

  // Create NEW Class
  const sched = slot || scheduleFromTutorAvailability(tutor);
  const slug = normSubject.replace(/[^a-z0-9]/g, "");

  const cls = await Class.create({
    title: `${subject} - ${tutorName}`,
    subject,
    tutor: tutor._id,
    students: [student._id],
    schedule: {
      day: sched.day,
      startTime: sched.startTime,
      endTime: sched.endTime,
    },
    status: "scheduled",
    sessionLink: `https://meet.jit.si/KK360-${slug}-${Date.now()}`,
  });
  return cls;
};

// --- END HELPERS ---

// @desc    Get all applications with filters
// @route   GET /api/admin/applications
// @access  Private/Admin
const getAllApplications = asyncHandler(async (req, res) => {
  const {
    status,
    educationLevel,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  } = req.query;

  let query = {};

  if (status) query.status = status;
  if (educationLevel) query.educationLevel = educationLevel;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const applications = await Application.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Application.countDocuments(query);

  res.json({
    applications,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// @desc    Get single application by ID
// @route   GET /api/admin/applications/:id
// @access  Private/Admin
const getApplicationById = asyncHandler(async (req, res) => {
  const param = req.params.id;
  let application = null;
  try {
    application = await Application.findById(param);
  } catch (e) {
    application = null;
  }
  if (!application) {
    application = await Application.findOne({
      $or: [{ applicationNumber: param }, { applicationId: param }],
    });
  }
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  const Televerification = require("../models/Televerification");
  const tv = await Televerification.findOne({
    application: application._id,
  }).populate("volunteer", "name email role");
  res.json({
    ...(application.toObject ? application.toObject() : application),
    televerification: tv,
  });
});

// @desc    Update application status
// @route   PUT /api/admin/applications/:id
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  application.status = status;
  if (remarks) application.remarks = remarks;

  await application.save();

  res.json({
    message: "Application status updated successfully",
    application,
  });
});

// @desc    Export applications as CSV
// @route   GET /api/admin/applications/export
// @access  Private/Admin
const exportApplications = asyncHandler(async (req, res) => {
  const { status, educationLevel, fromDate, toDate } = req.query;

  let query = {};

  if (status) query.status = status;
  if (educationLevel) query.educationLevel = educationLevel;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const applications = await Application.find(query).sort({ createdAt: -1 });

  // Create CSV content
  const csvHeaders =
    "Application ID,Student Name,Email,Phone,Education Level,Status,Created Date\n";
  const csvContent = applications
    .map(
      (app) =>
        `${app.applicationNumber},${app.studentName},${app.email},${app.phone
        },${app.educationLevel},${app.status},${app.createdAt.toISOString()}`
    )
    .join("\n");

  const csvData = csvHeaders + csvContent;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=applications.csv");
  res.send(csvData);
});

// @desc    Get application analytics
// @route   GET /api/admin/applications/analytics
// @access  Private/Admin
const getApplicationAnalytics = asyncHandler(async (req, res) => {
  // Get applications by status
  const statusStats = await Application.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get applications by education level
  const educationStats = await Application.aggregate([
    {
      $group: {
        _id: "$educationLevel",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get applications over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timeSeriesStats = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);

  res.json({
    statusStats,
    educationStats,
    timeSeriesStats,
  });
});

const getSelectedStudentsBySubject = asyncHandler(async (req, res) => {
  const apps = await Application.find({ status: "selected" });
  const result = [];
  for (const app of apps) {
    const subjects = Array.isArray(app.educationalInfo?.subjects)
      ? app.educationalInfo.subjects
      : [];
    // Find the student linked to this application once
    let studentDoc = null;
    const email = app.personalInfo?.email || app.email;
    if (email) {
      const userDoc = await User.findOne({
        $or: [{ email: email }, { "personalInfo.email": email }]
      });
      if (userDoc) {
        studentDoc = await Student.findOne({ user: userDoc._id });
      }
    }

    for (const s of subjects) {
      const name = app.personalInfo?.fullName || app.name || "";
      const medium = s.medium || app.educationalInfo?.medium || "";
      const subjectName = typeof s === "string" ? s : s.name;

      let tutors = [];

      // Fix: Query Class to see if a specific tutor is assigned for THIS subject
      if (studentDoc) {
        // Find class for this student + subject
        // Note: Class subject must match 'subjectName'
        const cls = await Class.findOne({
          students: studentDoc._id,
          subject: subjectName
        }).populate('tutor');

        if (cls && cls.tutor) {
          const assignedTutor = await Tutor.findById(cls.tutor._id).populate('user', 'name');
          if (assignedTutor) tutors = [assignedTutor];
        }
      }

      // Fallback: If not assigned (or legacy), show potential matches logic or just empty
      if (tutors.length === 0) {
        // Legacy fallback: check app.tutorAssignment if it matches subject
        if (app.tutorAssignment?.tutor) {
          const assigned = await Tutor.findById(app.tutorAssignment.tutor).populate("user", "name");
          // Only show legacy if subject strict matches
          if (assigned && (assigned.subjects || []).includes(subjectName)) {
            tutors = [assigned];
          }
        }
      }

      // Final Fallback: matching candidates
      if (tutors.length === 0) {
        tutors = await Tutor.find({ subjects: subjectName }).populate(
          "user",
          "name"
        );
      }

      const tutorList = tutors.map((t) => ({
        id: t._id,
        name: t.user?.name || "",
      }));

      // Dropout Prediction
      let dropoutRisk = "No Data";
      if (studentDoc) {
        const analytics = await calculateStudentProgress(studentDoc._id);
        dropoutRisk = analytics?.dropoutRisk || "No Data";
      }

      result.push({
        id: app._id,
        applicationId: app.applicationNumber,
        name,
        subject: subjectName,
        medium,
        tutors: tutorList,
        dropoutRisk,
      });
    }
  }
  res.json(result);
});

const getStudentDetails = asyncHandler(async (req, res) => {
  let student = null;
  const searchId = req.params.id;

  // 1. Try Find by MongoDB _id (if valid format)
  if (mongoose.Types.ObjectId.isValid(searchId)) {
    student = await Student.findById(searchId).populate(
      "user",
      "name email phone"
    );
  }

  // 2. If not found or not valid ObjectID, try finding via Application ID / Number
  if (!student) {
    const app = await Application.findOne({
      $or: [{ applicationId: searchId }, { applicationNumber: searchId }]
    });

    if (app) {
      const email = app.personalInfo?.email || app.email;
      const user = await User.findOne({
        $or: [{ email }, { "personalInfo.email": email }]
      });
      if (user) {
        student = await Student.findOne({ user: user._id }).populate(
          "user",
          "name email phone"
        );
      }
    }
  }

  if (!student) return res.status(404).json({ message: "Student not found" });
  const classes = await Class.find({ students: student._id }).populate("tutor");
  const attendance = Array.isArray(student.attendance)
    ? student.attendance
    : [];
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = totalAttendance
    ? Math.round((presentCount / totalAttendance) * 100)
    : 0;
  const assignments = await Assignment.find({
    class: { $in: classes.map((c) => c._id) },
  });
  const assignmentSubmissions = [];
  for (const a of assignments) {
    const sub = (a.submissions || []).find(
      (s) => String(s.student) === String(student._id)
    );
    if (sub)
      assignmentSubmissions.push({
        assignmentId: a._id,
        title: a.title,
        submittedAt: sub.submittedAt,
        grade: sub.grade,
      });
  }
  const tests = await Test.find({ class: { $in: classes.map((c) => c._id) } });
  const testSubmissions = [];
  for (const t of tests) {
    const sub = (t.submissions || []).find(
      (s) => String(s.student) === String(student._id)
    );
    if (sub)
      testSubmissions.push({
        testId: t._id,
        title: t.title,
        date: t.date,
        marks: sub.marks,
      });
  }
  const termBuckets = { midTerm: [], quarterly: [], halfYearly: [] };
  for (const ts of testSubmissions) {
    const title = (ts.title || "").toLowerCase();
    if (title.includes("mid")) termBuckets.midTerm.push(ts.marks || 0);
    else if (title.includes("quarter"))
      termBuckets.quarterly.push(ts.marks || 0);
    else if (title.includes("half")) termBuckets.halfYearly.push(ts.marks || 0);
  }
  const avg = (arr) =>
    arr.length
      ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 100) / 100
      : 0;
  const strength = {
    midTerm: avg(termBuckets.midTerm),
    quarterly: avg(termBuckets.quarterly),
    halfYearly: avg(termBuckets.halfYearly),
  };
  const basic = {
    name: student.user?.name || "",
    email: student.user?.email || "",
    phone: student.user?.phone || "",
    grade: student.grade,
    subjects: student.subjects,
  };
  // Calculate standardized history for Admin view (matching Tutor view)
  const history = [];
  for (const a of assignments) {
    const sub = (a.submissions || []).find(
      (s) => String(s.student) === String(student._id)
    );
    if (sub) {
      history.push({
        id: a._id,
        date: sub.submittedAt || a.dueDate,
        type: "Assignment",
        title: a.title,
        score: parseFloat(sub.grade) || 0,
        maxScore: 100,
        feedback: ""
      });
    }
  }
  for (const t of tests) {
    const sub = (t.submissions || []).find(
      (s) => String(s.student) === String(student._id)
    );
    if (sub) {
      history.push({
        id: t._id,
        date: t.date,
        type: "Test",
        title: t.title,
        score: sub.marks || 0,
        maxScore: 100,
        feedback: ""
      });
    }
  }
  history.sort((a, b) => new Date(b.date) - new Date(a.date));

  const analytics = await calculateStudentProgress(student._id);
  const dropoutRisk = analytics?.dropoutRisk || "No Data";

  res.json({
    basic,
    strength,
    attendanceRate,
    assignmentReport: assignmentSubmissions,
    testReport: testSubmissions,
    history, // Added for Tutor-like view
    notes: "", // Placeholder
    dropoutRisk
  });
});

const getTutorDetails = asyncHandler(async (req, res) => {
  console.log("[DEBUG] getTutorDetails called");
  const tutors = await Tutor.find().populate("user", "name email phone");
  console.log(`[DEBUG] Found ${tutors.length} tutors`);
  const details = [];
  for (const t of tutors) {
    const classes = await Class.find({ tutor: t._id }).populate({
      path: "students",
      populate: { path: "user", select: "name" },
    });
    const attendanceLog = classes.map((c) => ({
      classId: c._id,
      status: c.status,
    }));
    const timeHandling = classes.map((c) => ({
      classId: c._id,
      day: c.schedule?.day,
      startTime: c.schedule?.startTime,
      endTime: c.schedule?.endTime,
    }));
    const meetLinks = classes.map((c) => ({
      classId: c._id,
      title: c.title,
      link: c.sessionLink || null,
    }));
    details.push({
      id: t._id,
      userId: t.user?._id, // Added for messaging
      name: t.user?.name || "",
      email: t.user?.email || "",
      phone: t.user?.phone || "",
      subjects: t.subjects,
      qualifications: t.qualifications,
      availability: t.availability || [],
      classes: classes.map((c) => ({
        id: c._id,
        title: c.title,
        subject: c.subject,
        schedule: c.schedule,
        students: (c.students || []).map(s => ({
          id: s._id,
          name: s.user?.name || "Student"
        }))
      })),
      attendanceLog,
      timeHandling,
      meetLinks,
    });
  }
  res.json(details);
});

const getAllProgramStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().populate("user", "name email phone");
  const result = [];
  for (const s of students) {
    const classes = await Class.find({ students: s._id }).select("status");
    const total = Array.isArray(s.attendance) ? s.attendance.length : 0;
    const present = Array.isArray(s.attendance)
      ? s.attendance.filter((a) => a.status === "present").length
      : 0;
    const attendanceRate = total ? Math.round((present / total) * 100) : 0;
    const upcomingClasses = classes.filter(
      (c) => c.status !== "completed"
    ).length;
    const completedClasses = classes.filter(
      (c) => c.status === "completed"
    ).length;
    const analytics = await calculateStudentProgress(s._id);
    const dropoutRisk = analytics?.dropoutRisk || "No Data";

    result.push({
      id: s._id,
      name: s.user?.name || "",
      email: s.user?.email || "",
      grade: s.grade,
      status: "active",
      subjects: s.subjects || [],
      attendanceRate,
      upcomingClasses,
      completedClasses,
      dropoutRisk,
    });
  }
  res.json(result);
});

const getClassifiedStudents = asyncHandler(async (req, res) => {
  const { grade = "", subject } = req.query;
  const students = await Student.find().populate("user", "name email phone");
  const norm = (v) =>
    String(v || "")
      .trim()
      .toLowerCase();
  const wanted = norm(grade);
  const synonyms = (g) => {
    const n = norm(g);
    if (n.includes("12")) return ["12", "12th", "xii", "12th grade"];
    if (n.includes("11")) return ["11", "11th", "xi", "11th grade"];
    if (n.includes("10")) return ["10", "10th", "x", "10th grade"];
    return [g].filter(Boolean);
  };
  const acceptedList = wanted ? synonyms(wanted).map(norm) : [];
  const results = [];
  for (const s of students) {
    const g = norm(s.grade);
    const matchesGrade = wanted
      ? acceptedList.some((a) => g.includes(a))
      : true;
    if (!matchesGrade) continue;
    if (subject && !(s.subjects || []).includes(subject)) continue;
    const email = s.user?.email || "";
    const app = await Application.findOne({
      $or: [{ "personalInfo.email": email }, { email }],
    });
    const educational = app?.educationalInfo || {};
    const personal = app?.personalInfo || {};
    const family = app?.familyInfo || {};
    const subjects = Array.isArray(educational.subjects)
      ? educational.subjects.map((x) => x?.name || x)
      : s.subjects || [];
    const analytics = await calculateStudentProgress(s._id);
    const dropoutRisk = analytics?.dropoutRisk || "No Data";

    results.push({
      id: s._id,
      name: s.user?.name || personal.fullName || "",
      email,
      phone: s.user?.phone || personal.phone || "",
      grade: s.grade,
      medium: educational.medium || "",
      board: educational.board || "",
      schoolName: educational.schoolName || "",
      subjects,
      tenthPercentage: educational.tenthPercentage || "",
      currentPercentage: educational.currentPercentage || "",
      annualIncome: family.annualIncome || "",
      dropoutRisk,
    });
  }
  res.json(results);
});

// @desc    Assign tutor to application and schedule meeting using tutor availability
// @route   POST /api/admin/applications/:id/assign-tutor
// @access  Private/Admin
// @desc    Assign tutor to application and schedule meeting using tutor availability
// @route   POST /api/admin/applications/:id/assign-tutor
// @access  Private/Admin
const assignTutorToApplication = asyncHandler(async (req, res) => {
  const { tutorId } = req.body;
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) {
    res.status(404);
    throw new Error("Tutor not found");
  }

  // Helper to ensure student exists
  const student = await createOrFindStudentFromApplication(application);

  const avail = Array.isArray(tutor.availability) ? tutor.availability : [];
  const pick = avail[0] || {
    day: "Monday",
    startTime: "18:00",
    endTime: "19:00",
  };

  // Ensure class exists and student is enrolled
  const subject = application.educationalInfo?.subjects?.[0]?.name || application.educationalInfo?.subjects?.[0] || "General";
  const cls = await ensureClassForTutorAndStudent(tutor, student, subject, pick);

  application.tutorAssignment = {
    tutor: tutor._id,
    meetingLink: cls.sessionLink,
    schedule: cls.schedule,
  };
  application.status = "selected"; // Auto-mark as selected/assigned
  await application.save();

  res.json({
    message: "Tutor assigned and schedule set",
    assignment: application.tutorAssignment,
    classId: cls._id
  });
});

// Remove or comment out any earlier `module.exports = { ... }` that appears before function definitions

// Auto-map selected students to tutors
const pickTutorForSubjects = async (subjects) => {
  const norm = (s) => String(s || "").trim();
  const wanted = (subjects || []).map((x) =>
    typeof x === "string" ? norm(x) : norm(x?.name)
  );
  const tutors = await Tutor.find({
    subjects: { $in: wanted },
    status: { $in: ["active", "pending"] },
  });
  const availableTutors = tutors.filter(
    (t) => Array.isArray(t.availability) && t.availability.length > 0
  );
  const pool = availableTutors.length ? availableTutors : tutors;
  if (!pool.length) return null;

  // Load balancing logic: Pick tutor with fewest students
  const withCounts = await Promise.all(
    pool.map(async (t) => {
      const classes = await Class.find({ tutor: t._id });
      const count = classes.reduce(
        (sum, c) => sum + (c.students || []).length,
        0
      );
      return { tutor: t, count };
    })
  );

  // Sort by count (ascending), then experience (descending)
  withCounts.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return (b.tutor.experienceYears || 0) - (a.tutor.experienceYears || 0);
  });

  // Log selection for debugging
  console.log(
    `AutoMap: Picked ${withCounts[0].tutor.user} (Load: ${withCounts[0].count})`
  );

  return withCounts[0].tutor;
};

// Helper functions moved to top of file
// createOrFindStudentFromApplication
// ensureClassForTutorAndStudent
// scheduleEquals
// scheduleFromTutorAvailability
// ... are now defined at the top scope.

// @desc    Auto-map selected applications to tutors (group by primary subject)
// @route   POST /api/admin/applications/automap
// @access  Private/Admin
const autoMapSelectedApplications = asyncHandler(async (req, res) => {
  const apps = await Application.find({ status: "selected" });
  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase();
  const subjectGroups = new Map();
  for (const app of apps) {
    const educational = app.educationalInfo || {};
    const subjects = Array.isArray(educational.subjects)
      ? educational.subjects.map((x) => x?.name || x)
      : [];
    const primarySubject = subjects[0] || "";
    const key = norm(primarySubject);
    if (!key) continue;
    if (!subjectGroups.has(key)) subjectGroups.set(key, []);
    subjectGroups.get(key).push({ app, primarySubject });
  }

  const mapped = [];
  const groupsByTutor = new Map();
  for (const [subjectKey, group] of subjectGroups.entries()) {
    const subjectName = group[0].primarySubject; // original case from first
    const tutor = await pickTutorForSubjects([subjectName]);
    if (!tutor) {
      for (const { app } of group)
        mapped.push({
          applicationId: app._id,
          subject: subjectName,
          status: "no_tutor",
        });
      continue;
    }
    // Advanced scheduling: pick the tutor slot that covers the most students in this group
    const studentDocs = [];
    for (const { app } of group) {
      try {
        const student = await createOrFindStudentFromApplication(app);
        studentDocs.push({ student, app });
      } catch (e) {
        mapped.push({
          applicationId: app._id,
          subject: subjectName,
          status: "error",
          error: e.message,
        });
      }
    }

    const best = pickBestTutorSlotForStudents(
      tutor,
      studentDocs.map((s) => s.student)
    );
    let cls = null;
    if (best && best.count > 0) {
      const slot = best.slot;
      for (const { student, app } of studentDocs) {
        try {
          const sAvail = Array.isArray(student.availability)
            ? student.availability
            : [];
          if (!sAvail.some((sa) => timeRangesOverlap(slot, sa))) continue; // skip students not available

          if (!cls) {
            // create class with schedule=slot
            cls = await ensureClassForTutorAndStudent(
              tutor,
              student,
              subjectName,
              slot
            );
          } else {
            const already = (cls.students || []).some(
              (s) => String(s) === String(student._id)
            );
            if (!already) {
              cls.students = [...(cls.students || []), student._id];
              await cls.save();
            }
          }

          mapped.push({
            applicationId: app._id,
            classId: cls._id,
            tutorId: tutor._id,
            subject: subjectName,
          });

          app.status = "selected";
          app.tutorAssignment = {
            tutor: tutor._id,
            meetingLink: cls.sessionLink,
            schedule: cls.schedule,
          };
          await app.save();

          // accumulate per-tutor group info to return to client
          const tKey = String(tutor._id);
          if (!groupsByTutor.has(tKey)) {
            groupsByTutor.set(tKey, {
              tutorId: tutor._id,
              tutorName: null,
              classId: cls._id,
              meetingLink: cls.sessionLink,
              subject: subjectName,
              schedule: cls.schedule,
              applications: [String(app._id)],
            });
          } else {
            const g = groupsByTutor.get(tKey);
            g.applications.push(String(app._id));
          }

          try {
            const email = app.personalInfo?.email || app.email;
            const tutorUser = await User.findById(tutor.user).select(
              "name email"
            );
            const eventTitle = `${subjectName} class with ${tutorUser?.name || "Tutor"
              }`;
            const eventDate = `${cls.schedule?.day || ""} ${cls.schedule?.startTime || ""
              }-${cls.schedule?.endTime || ""}`;
            if (email)
              await NotificationService.sendEventReminder(
                email,
                eventTitle,
                eventDate
              );
            if (tutorUser?.email)
              await NotificationService.sendEventReminder(
                tutorUser.email,
                `New ${subjectName} group assigned`,
                eventDate
              );
          } catch { }
        } catch (e) {
          mapped.push({
            applicationId: app._id,
            subject: subjectName,
            status: "error",
            error: e.message,
          });
        }
      }
    } else {
      // If no matching slot found, mark no_slot for each application in this group
      for (const { app } of group) {
        mapped.push({
          applicationId: app._id,
          subject: subjectName,
          status: "no_slot",
        });
      }
    }
  }

  // convert groupsByTutor map to array with tutor names populated if possible
  const groups = [];
  for (const [tKey, info] of groupsByTutor.entries()) {
    const tutorDoc = await Tutor.findById(info.tutorId).populate(
      "user",
      "name"
    );
    groups.push({
      tutorId: info.tutorId,
      tutorName: tutorDoc?.user?.name || tutorDoc?.name || null,
      classId: info.classId,
      meetingLink: info.meetingLink,
      subject: info.subject,
      applications: info.applications,
      applicationCount: info.applications.length,
    });
  }

  res.json({
    groups: Array.from(subjectGroups.keys()),
    mappedCount: mapped.length,
    mapped,
    groupsByTutor: groups,
  });
});
// End autoMapSelectedApplications

// Ensure these helpers are defined before module.exports
const runAutoMap = asyncHandler(async (req, res) => {
  const { subject } = req.body || {};

  // build query: unassigned students
  const studentQuery = {
    $or: [{ tutor: { $exists: false } }, { tutor: null }],
  };
  if (subject) {
    // assume Student.subjects is an array or string
    studentQuery.subjects = subject;
  }

  const students = await Student.find(studentQuery).lean();
  if (!students || students.length === 0) {
    return res.json({ message: "No unassigned students found", mappings: [] });
  }

  const mappings = [];

  // helper: get tutors for a subject
  async function getTutorsForSubject(subj) {
    return await Tutor.find({ subjects: subj }).populate("user", "name").exec();
  }

  // group students by subject
  const studentsBySubject = {};
  for (const s of students) {
    const subs =
      Array.isArray(s.subjects) && s.subjects.length ? s.subjects : ["general"];
    const subjectKey = subject || subs[0];
    if (!studentsBySubject[subjectKey]) studentsBySubject[subjectKey] = [];
    studentsBySubject[subjectKey].push(s);
  }

  for (const subj of Object.keys(studentsBySubject)) {
    const pool = studentsBySubject[subj];
    const tutors = await getTutorsForSubject(subj);

    if (!tutors || tutors.length === 0) {
      pool.forEach((st) =>
        mappings.push({
          studentId: st._id,
          studentName: st.name || st.fullName || st.email || String(st._id),
          tutorId: null,
          tutorName: null,
          subject: subj,
          note: "No available tutor for subject",
        })
      );
      continue;
    }

    // simple round-robin assignment
    let tutorIndex = 0;
    for (const st of pool) {
      const tutor = tutors[tutorIndex % tutors.length];

      // update student record
      await Student.updateOne(
        { _id: st._id },
        { $set: { tutor: tutor._id } }
      ).exec();

      // add student to tutor's students array (use $addToSet)
      await Tutor.updateOne(
        { _id: tutor._id },
        { $addToSet: { students: st._id } }
      ).exec();

      // Ensure class enrollment
      await ensureClassForTutorAndStudent(tutor, st, subj);

      mappings.push({
        studentId: st._id,
        studentName: st.name || st.fullName || st.email || String(st._id),
        tutorId: tutor._id,
        tutorName:
          (tutor.user && tutor.user.name) || tutor.name || String(tutor._id),
        subject: subj,
        note: "Assigned",
      });

      tutorIndex++;
    }
  }

  const totalMapped = mappings.filter((m) => m.tutorId).length;
  // log for debugging if counts appear incorrect in UI
  console.log(
    `runAutoMap: total mappings returned=${mappings.length}, totalMapped=${totalMapped}`
  );

  return res.json({
    message: "Auto-map complete",
    mappings,
    totalMapped,
  });
});

/**
 * autoMapSelectedStudents
 * Body: { studentIds: string[], tutorId: string }
 * Assigns listed students to the specified tutor and updates tutor.students
 */
const autoMapSelectedStudents = asyncHandler(async (req, res) => {
  const { studentIds, tutorId } = req.body || {};
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: "studentIds array required" });
  }
  if (!tutorId) {
    return res.status(400).json({ message: "tutorId required" });
  }

  const tutor = await Tutor.findById(tutorId);
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });

  const mappings = [];
  for (const sid of studentIds) {
    const student = await Student.findById(sid).lean();
    if (!student) {
      mappings.push({ studentId: sid, tutorId, note: "Student not found" });
      continue;
    }

    await Student.updateOne(
      { _id: sid },
      { $set: { tutor: tutor._id } }
    ).exec();
    await Tutor.updateOne(
      { _id: tutor._id },
      { $addToSet: { students: sid } }
    ).exec();

    // Ensure class enrollment
    // We don't have subject here, assume General or derive from student subjects
    const subj = (student.subjects && student.subjects[0]) || "General";
    await ensureClassForTutorAndStudent(tutor, student, subj);

    mappings.push({
      studentId: sid,
      studentName:
        student.name || student.fullName || student.email || String(sid),
      tutorId: tutor._id,
      tutorName:
        (tutor.user && tutor.user.name) || tutor.name || String(tutor._id),
      note: "Assigned",
    });
  }

  return res.json({
    message: "Selected students mapped",
    mappings,
    totalMapped: mappings.length,
  });
});

// protect & authorize should be applied at route level

// POST /api/admin/automap
// Body: { subject?: string }
// Returns list of mappings { studentId, studentName, tutorId, tutorName, subject }
exports.runAutoMap = runAutoMap;

const getMeetingLogs = asyncHandler(async (req, res) => {
  const sessions = await require("../models/ClassSession").find()
    .populate('tutor', 'name email') // assuming tutor has name/email or populates user
    .populate({
      path: 'tutor',
      populate: { path: 'user', select: 'name email' }
    })
    .populate('class', 'title subject')
    .sort({ startTime: -1 });

  res.json(sessions);
});

// At the very end of the file, after all controller functions are defined, add:
module.exports = {
  getMeetingLogs,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  exportApplications,
  getApplicationAnalytics,
  getSelectedStudentsBySubject,
  getStudentDetails,
  getTutorDetails,
  getAllProgramStudents,
  getClassifiedStudents,
  assignTutorToApplication,
  autoMapSelectedApplications,
  autoMapSelectedStudents,
  runAutoMap,
  // helpers (exported for testing/utility)
  timeRangesOverlap,
  pickBestTutorSlotForStudents,
  ensureClassForTutorAndStudent,
  // add any other controllers you have defined...
};

// POST /api/admin/force-create-class
const forceCreateClassForApplications = asyncHandler(async (req, res) => {
  const { tutorId, subject, slot, applicationIds } = req.body || {};
  if (
    !tutorId ||
    !subject ||
    !slot ||
    !Array.isArray(applicationIds) ||
    applicationIds.length === 0
  )
    return res
      .status(400)
      .json({
        message: "tutorId, subject, slot and applicationIds are required",
      });
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });

  // create class with slot
  const title = `${subject} - ${tutor.name || "Group"}`;
  const slug = String(subject || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const cls = await Class.create({
    title,
    subject,
    tutor: tutor._id,
    students: [],
    schedule: {
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
    status: "scheduled",
    sessionLink: `https://meet.google.com/kk-class-${tutor._id}-${slug}`,
  });

  const mapped = [];
  for (const aid of applicationIds) {
    const app = await Application.findById(aid);
    if (!app) continue;
    const student = await createOrFindStudentFromApplication(app);
    cls.students = [...(cls.students || []), student._id];
    app.status = "selected";
    app.tutorAssignment = {
      tutor: tutor._id,
      meetingLink: cls.sessionLink,
      schedule: cls.schedule,
    };
    await app.save();
    mapped.push({ applicationId: app._id, studentId: student._id });
  }
  await cls.save();
  return res.json({
    message: "Class created and applications assigned",
    class: cls,
    mapped,
  });
});

// @desc    Repair student-class data linkages (and fix TutorID mismatch)
// @route   GET /api/admin/repair-data
// @access  Public (Temporary)
const repairStudentData = asyncHandler(async (req, res) => {
  console.log("Starting repair of student-class linkages via API...");
  const apps = await Application.find({
    status: 'selected',
    'tutorAssignment.tutor': { $exists: true }
  });

  let fixedCount = 0;
  const logs = [];
  const Tutor = require("../models/Tutor"); // ensure model loaded

  for (const app of apps) {
    try {
      const email = app.personalInfo?.email || app.email;
      let tutorId = app.tutorAssignment.tutor;

      if (!email || !tutorId) continue;

      // 1. Validate/Fix Tutor ID (Check if it's a USER ID by mistake)
      let tutor = await Tutor.findById(tutorId);
      if (!tutor) {
        // Check if this ID belongs to a User who IS a tutor
        const tutorByUser = await Tutor.findOne({ user: tutorId });
        if (tutorByUser) {
          logs.push(`Fixing ID mismatch for app ${app._id}: Found UserID ${tutorId}, swapping for TutorID ${tutorByUser._id}`);
          app.tutorAssignment.tutor = tutorByUser._id;
          await app.save();
          tutorId = tutorByUser._id; // update for class lookup
          tutor = tutorByUser;
          fixedCount++;
        } else {
          logs.push(`Skipping app ${app._id}: TutorID ${tutorId} not found in Tutor or User collection`);
          continue;
        }
      }

      // 2. Find Student User
      const user = await User.findOne({
        $or: [{ email: email }, { 'personalInfo.email': email }]
      });

      if (!user) continue;

      const student = await Student.findOne({ user: user._id });
      if (!student) {
        logs.push(`Student profile missing for user ${user.email}`);
        continue;
      }

      const educational = app.educationalInfo || {};
      const subjects = Array.isArray(educational.subjects)
        ? educational.subjects.map((x) => x?.name || x)
        : ["General"];
      const subject = subjects[0] || "General";

      // 3. Ensure Class exists for this TUTOR
      // Use the helper that now handles proper titles and links
      const cls = await ensureClassForTutorAndStudent(tutor, student, subject);

      if (cls) {
        logs.push(`Ensured class ${cls._id} with title "${cls.title}" and link "${cls.sessionLink}"`);
        fixedCount++;
      }
    } catch (err) {
      logs.push(`Error processing app ${app._id}: ${err.message}`);
    }
  }

  console.log(`Repair complete. Fixed ${fixedCount} linkages.`);
  res.json({ message: "Repair complete", fixedCount, logs });
});

// export new function
module.exports.forceCreateClassForApplications = forceCreateClassForApplications;
// @desc    Diagnose system data integrity
// @route   GET /api/admin/diagnose
// @access  Public (Temporary)
const diagnoseSystem = asyncHandler(async (req, res) => {
  const logs = [];
  const log = (msg) => logs.push(msg);

  log("=== System Diagnostic ===");

  // 1. Check Tutors
  const tutors = await Tutor.find().populate('user', 'name email');
  log(`Found ${tutors.length} Tutors`);
  const tutorMap = new Map(); // TutorID -> Name
  tutors.forEach(t => {
    log(`Tutor: ${t._id}, User: ${t.user?._id} (${t.user?.name})`);
    tutorMap.set(String(t._id), t.user?.name || "Unknown");
  });

  // 2. Check Classes
  const classes = await Class.find();
  log(`Found ${classes.length} Classes`);
  classes.forEach(c => {
    const tName = tutorMap.get(String(c.tutor)) || `Unknown (${c.tutor})`;
    log(`Class: ${c._id}, Title: ${c.title}, Tutor: ${tName}, Students: ${c.students.length}`);
  });

  // 3. Check App Assignments
  const apps = await Application.find({ status: 'selected', 'tutorAssignment.tutor': { $exists: true } });
  log(`Found ${apps.length} Selected & Assigned Apps`);

  for (const app of apps) {
    const assignedTutorId = String(app.tutorAssignment.tutor);
    const tName = tutorMap.get(assignedTutorId);
    if (!tName) {
      log(`[WARNING] App ${app._id} (${app.personalInfo?.fullName}) assigned to NON-EXISTENT TutorID: ${assignedTutorId}`);
      // Check if it matches a User ID?
      const userMatch = tutors.find(t => String(t.user?._id) === assignedTutorId);
      if (userMatch) {
        log(`   -> MATCHES USER ID of Tutor ${userMatch.user?.name}! (This is the bug)`);
      }
    } else {
      // Verify class enrollment
      const cls = await Class.findOne({ tutor: assignedTutorId, students: { $in: [await getUserForApp(app)] } });
      // We need helper to resolve student ID from app
    }
  }

  res.json({ logs });
});

async function getUserForApp(app) {
  // simplified lookup
  const email = app.personalInfo?.email || app.email;
  const User = require("../models/User");
  const Student = require("../models/Student");
  const u = await User.findOne({ $or: [{ email }, { 'personalInfo.email': email }] });
  if (u) {
    const s = await Student.findOne({ user: u._id });
    return s ? s._id : null;
  }
  return null;
}

module.exports.diagnoseSystem = diagnoseSystem;
module.exports.repairStudentData = repairStudentData;
