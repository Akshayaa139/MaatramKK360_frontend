const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Tutor = require("../models/Tutor");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Application = require("../models/Application");
const { autoMapSelectedStudents } = require("../controllers/adminController");
const {
  createStudyMaterial,
} = require("../controllers/studyMaterialController");
const multer = require("multer");
const path = require("path");

// multer storage for study materials
const studyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "study-materials"));
  },
  filename: function (req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    )}`;
    cb(null, safe);
  },
});
const studyUpload = multer({
  storage: studyStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: function (req, file, cb) {
    const allowed =
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf";
    if (!allowed)
      return cb(
        new Error(
          "Unsupported file type. Allowed: video/*, image/*, application/pdf"
        )
      );
    cb(null, true);
  },
});
const { createFlashcardSet } = require("../controllers/flashcardController");

// Helper: find Tutor doc by current user
async function getTutorForUser(userId) {
  const tutor = await Tutor.findOne({ user: userId });
  return tutor;
}

// GET /api/tutor/profile - get combined user+tutor profile
router.get("/profile", protect, authorize("tutor"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const tutor = await getTutorForUser(req.user._id);
    res.json({ user, tutor });
  } catch (e) {
    console.error("Tutor profile fetch failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/tutor/profile - update tutor + user profile
router.put("/profile", protect, authorize("tutor"), async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      subjects,
      qualifications,
      subjectPreferences,
      experienceYears,
    } = req.body;

    const User = require("../models/User");
    const Tutor = require("../models/Tutor");

    // find user
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // email conflict check
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing)
        return res.status(409).json({ message: "Email already in use" });
      user.email = email;
    }

    if (typeof name === "string") user.name = name;
    if (typeof phone === "string") user.phone = phone;
    await user.save();

    // update or create Tutor doc
    let tutor = await Tutor.findOne({ user: user._id });
    if (!tutor) {
      tutor = new Tutor({ user: user._id });
    }

    if (Array.isArray(subjects)) tutor.subjects = subjects;
    if (typeof qualifications !== "undefined")
      tutor.qualifications = qualifications;
    if (Array.isArray(subjectPreferences))
      tutor.subjectPreferences = subjectPreferences;
    if (typeof experienceYears !== "undefined")
      tutor.experienceYears = experienceYears;

    await tutor.save();

    return res.json({
      message: "Profile updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      tutor,
    });
  } catch (err) {
    console.error("PUT /api/tutor/profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/tutor/availability - set weekly availability
router.put("/availability", protect, authorize("tutor"), async (req, res) => {
  try {
    const { availability } = req.body; // [{ day, startTime, endTime }]
    let tutor = await getTutorForUser(req.user._id);
    if (!tutor) return res.status(404).json({ message: "Tutor not found" });
    tutor.availability = Array.isArray(availability) ? availability : [];
    await tutor.save();
    res.json({
      message: "Availability updated",
      availability: tutor.availability,
    });
  } catch (e) {
    console.error("Availability update failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/tutor/leave - set or clear leave date
router.put("/leave", protect, authorize("tutor"), async (req, res) => {
  try {
    const { leaveDate } = req.body; // ISO string or null
    let tutor = await getTutorForUser(req.user._id);
    if (!tutor) return res.status(404).json({ message: "Tutor not found" });
    tutor.leaveDate = leaveDate ? new Date(leaveDate) : null;
    await tutor.save();
    res.json({ message: "Leave updated", leaveDate: tutor.leaveDate });
  } catch (e) {
    console.error("Leave update failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/tutor/students - list students assigned to tutor
router.get("/students", protect, authorize("tutor"), async (req, res) => {
  try {
    const tutor = await getTutorForUser(req.user._id);
    if (!tutor) return res.json([]);

    // Safety check: if tutor exists but has no _id, return empty to prevent "scan all" query
    if (!tutor._id) {
      console.error(`Tutor object found but has no _id for User ${req.user._id}`);
      return res.json([]);
    }

    // 1. Get students explicitly assigned to this tutor
    const assignedStudents = await Student.find({ tutor: tutor._id }).populate("user", "name email");

    // 2. Get students in tutor's classes (handling legacy/manual adds)
    const classes = await Class.find({ tutor: tutor._id }).populate({
      path: "students",
      populate: { path: "user", select: "name email" },
    });

    const seen = new Set();
    const students = [];

    // Helper to add student safely
    const tutorSubjects = (tutor.subjects || []).map((subj) =>
      String(subj).trim().toLowerCase()
    );

    const addStudent = async (s) => {
      if (!s) return;

      // Filter: Check subject overlap
      const studentSubjects = (Array.isArray(s.subjects) ? s.subjects : []).map(
        (subj) => String(subj).trim().toLowerCase()
      );

      // If tutor has specific subjects, ensure at least one matches
      if (
        tutorSubjects.length > 0 &&
        !studentSubjects.some((subj) => tutorSubjects.includes(subj))
      ) {
        return; // Skip this student
      }

      const sid = String(s._id);
      if (!seen.has(sid)) {
        seen.add(sid);

        // compute basic progress metrics
        let attendanceRate = 0;
        let testAvg = 0;
        try {
          // If s is from Class, it might be partial, so ensure we have full doc if needed, 
          // but here we just need ID for progress calc which fetches fresh doc anyway
          const studDoc = await Student.findById(s._id);
          const attendance = Array.isArray(studDoc?.attendance) ? studDoc.attendance : [];
          const presentCount = attendance.filter((a) => a.status === "present").length;
          const denom = attendance.length;
          attendanceRate = denom ? Math.round((presentCount / denom) * 100) : 0;

          const perf = Array.isArray(studDoc?.performance) ? studDoc.performance : [];
          let totalScore = 0, totalMax = 0;
          for (const p of perf) {
            totalScore += Number(p.score || 0);
            totalMax += Number(p.maxScore || 0) || 0;
          }
          testAvg = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;
        } catch (e) { }

        const composite = Math.round(0.7 * testAvg + 0.3 * attendanceRate);
        students.push({
          _id: s._id,
          name: s.user?.name || "Student",
          email: s.user?.email,
          grade: s.grade,
          subjects: s.subjects,
          progress: composite,
        });
      }
    };

    // Add explicitly assigned
    for (const s of assignedStudents) {
      await addStudent(s);
    }

    // Add from classes
    for (const c of classes) {
      for (const s of c.students || []) {
        await addStudent(s);
      }
    }

    res.json(students);
  } catch (e) {
    console.error("Tutor students fetch failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/tutor/sessions/upcoming - upcoming sessions from classes schedule
router.get(
  "/sessions/upcoming",
  protect,
  authorize("tutor"),
  async (req, res) => {
    try {
      const tutor = await getTutorForUser(req.user._id);
      if (!tutor) return res.json([]);
      const classes = await Class.find({ tutor: tutor._id });

      // Special-case: if tutor user/name contains "dharshini", aggregate classes by subject
      // to avoid showing a separate scheduled session per student (legacy data had one class per student)
      const username = String(req.user?.name || "").toLowerCase();
      if (username.includes("dharshini")) {
        const bySubject = new Map();
        for (const c of classes) {
          const key = String(c.subject || "")
            .trim()
            .toLowerCase();
          if (!bySubject.has(key)) bySubject.set(key, []);
          bySubject.get(key).push(c);
        }
        const sessions = [];
        for (const [k, list] of bySubject.entries()) {
          const canonical = list[0];
          const allStudents = new Set(
            list.flatMap((c) => (c.students || []).map((s) => String(s)))
          );
          const schedule =
            canonical.schedule || list.find((x) => x.schedule)?.schedule || {};
          sessions.push({
            id: canonical._id,
            title: `${canonical.subject} - ${allStudents.size} students`,
            subject: canonical.subject,
            day: schedule.day,
            time: `${schedule.startTime || ""} - ${schedule.endTime || ""}`,
            status: canonical.status,
            aggregated: true,
          });
        }
        return res.json(sessions);
      }

      const sessions = classes.map((c) => ({
        id: c._id,
        title: c.title,
        subject: c.subject,
        day: c.schedule?.day,
        time: `${c.schedule?.startTime || ""} - ${c.schedule?.endTime || ""}`,
        status: c.status,
      }));
      res.json(sessions);
    } catch (e) {
      console.error("Upcoming sessions fetch failed:", e);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// GET /api/tutor/applications - applications potentially relevant to tutor subjects
router.get("/applications", protect, authorize("tutor"), async (req, res) => {
  try {
    const tutor = await getTutorForUser(req.user._id);
    if (!tutor) return res.json([]);
    const apps = await Application.find({
      "educationalInfo.subjects.name": { $in: tutor.subjects },
    }).select("personalInfo submittedAt status");
    res.json(apps);
  } catch (e) {
    console.error("Tutor applications fetch failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/tutor/study-materials - create a material (link/metadata)
router.post(
  "/study-materials",
  protect,
  authorize("tutor"),
  createStudyMaterial
);

// GET /api/tutor/study-materials/my - list tutor's own materials
router.get(
  "/study-materials/my",
  protect,
  authorize("tutor"),
  require("../controllers/studyMaterialController").listMyMaterials
);

// DELETE /api/tutor/study-materials/:id - delete a material
router.delete(
  "/study-materials/:id",
  protect,
  authorize("tutor"),
  require("../controllers/studyMaterialController").deleteStudyMaterial
);

// PUT /api/tutor/study-materials/:id - update metadata
router.put(
  "/study-materials/:id",
  protect,
  authorize("tutor"),
  require("../controllers/studyMaterialController").updateStudyMaterial
);

// File upload endpoint
router.post(
  "/study-materials/upload",
  protect,
  authorize("tutor"),
  studyUpload.single("file"),
  require("../controllers/studyMaterialController").uploadStudyMaterial
);

router.post("/flashcards", protect, authorize("tutor"), createFlashcardSet);

// GET /api/tutor/performance - simple aggregate stats
router.get("/performance", protect, authorize("tutor"), async (req, res) => {
  try {
    const tutor = await getTutorForUser(req.user._id);
    if (!tutor)
      return res.json({
        totalStudents: 0,
        activeStudents: 0,
        completedSessions: 0,
        averageRating: 0,
        totalHours: 0,
      });
    const classes = await Class.find({ tutor: tutor._id }).populate("students");
    const totalStudents = classes.reduce(
      (sum, c) => sum + (Array.isArray(c.students) ? c.students.length : 0),
      0
    );
    const activeStudents = totalStudents;
    const completedSessions = classes.filter(
      (c) => c.status === "completed"
    ).length;
    const toMinutes = (t) => {
      const [h, m] = String(t || "0:0")
        .split(":")
        .map(Number);
      return h * 60 + (m || 0);
    };
    const totalMinutes = classes.reduce(
      (sum, c) =>
        sum +
        Math.max(
          0,
          toMinutes(c.schedule?.endTime) - toMinutes(c.schedule?.startTime)
        ),
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    res.json({
      totalStudents,
      activeStudents,
      completedSessions,
      averageRating: 0,
      totalHours,
    });
  } catch (e) {
    console.error("Tutor performance fetch failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// Tutor-triggered automap (restricted to tutor role)
router.post("/automap", protect, authorize("tutor"), async (req, res) => {
  try {
    const result = await autoMapSelectedStudents(req, res);
    return result;
  } catch (e) {
    console.error("Tutor automap failed:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/tutor/progress - comprehensive student progress list
router.get("/progress", protect, authorize("tutor"), async (req, res) => {
  try {
    const tutor = await getTutorForUser(req.user._id);
    if (!tutor) return res.json([]);

    // 1. Get all classes for this tutor
    const classes = await Class.find({ tutor: tutor._id }).select("title subject");
    const classIds = classes.map((c) => c._id);

    // 2. Find all students in these classes
    const classDocs = await Class.find({ tutor: tutor._id }).populate({
      path: "students",
      populate: { path: "user", select: "name email" },
    });

    // Unique students map
    const studentMap = new Map();
    for (const c of classDocs) {
      for (const s of c.students || []) {
        if (!studentMap.has(String(s._id))) {
          studentMap.set(String(s._id), {
            doc: s,
            classes: [c.title],
            classId: c._id // keep one for reference
          });
        } else {
          studentMap.get(String(s._id)).classes.push(c.title);
        }
      }
    }

    // 3. Fetch all Assignments & Tests for these classes
    const assignments = await require("../models/Assignment").find({ class: { $in: classIds } });
    const tests = await require("../models/Test").find({ class: { $in: classIds } });

    const results = [];
    for (const [sid, data] of studentMap.entries()) {
      const { doc: s, classes: classNames } = data;

      // Attendance
      const att = Array.isArray(s.attendance) ? s.attendance : [];
      const present = att.filter(a => a.status === 'present').length;
      const totalAtt = att.length;
      const attendancePct = totalAtt ? Math.round((present / totalAtt) * 100) : 0;

      // Assignments
      const studentAssig = assignments.filter(a =>
        (a.submissions || []).some(sub => String(sub.student) === sid)
      );
      const totalAssig = assignments.length; // Approximate: assuming all assignments in class apply to student
      // A better way is filtering assignments by the student's specific class, but simplification:
      // We will filter assignments that belong to the classes this student is in.
      // But we have student -> classes map. 
      // Let's refine: assignments for classes THIS student is enrolled in.
      const studentClassIds = classDocs.filter(c => c.students.some(st => String(st._id) === sid)).map(c => String(c._id));
      const relevantAssignments = assignments.filter(a => studentClassIds.includes(String(a.class)));
      const relevantTests = tests.filter(t => studentClassIds.includes(String(t.class)));

      const submittedAssig = relevantAssignments.filter(a =>
        (a.submissions || []).some(sub => String(sub.student) === sid && sub.grade)
      );

      let assigScoreSum = 0;
      let assigCount = 0;
      submittedAssig.forEach(a => {
        const sub = a.submissions.find(sub => String(sub.student) === sid);
        // Grade might be "A", "80/100" or just "80". Let's try to parse number.
        const val = parseFloat(sub.grade);
        if (!isNaN(val)) {
          assigScoreSum += val; // Assuming grade is out of 100 or normalized
          assigCount++;
        }
      });
      const assigAvg = assigCount ? Math.round(assigScoreSum / assigCount) : 0;

      // Tests
      const submittedTests = relevantTests.filter(t =>
        (t.submissions || []).some(sub => String(sub.student) === sid && typeof sub.marks === 'number')
      );
      let testScoreSum = 0;
      let testCount = 0;
      submittedTests.forEach(t => {
        const sub = t.submissions.find(sub => String(sub.student) === sid);
        testScoreSum += (sub.marks || 0);
        testCount++;
      });
      // Assuming max marks is usually 100 or available in test. But for now just avg the raw marks
      // Ideally we need test.totalMarks. stored in models/Test.js? No, just duration/date. 
      // We'll calculate percentage if maxScore is available in performance, but here we depend on `Test` model.
      // Let's assume marks are percent for now or raw.
      const testAvg = testCount ? Math.round(testScoreSum / testCount) : 0;

      // Trend: Compare average of last 3 items vs previous
      // Combine all temporal data
      const history = [];
      relevantAssignments.forEach(a => {
        const sub = (a.submissions || []).find(sub => String(sub.student) === sid);
        if (sub) history.push({ date: sub.submittedAt || a.dueDate, score: parseFloat(sub.grade) || 0 });
      });
      relevantTests.forEach(t => {
        const sub = (t.submissions || []).find(sub => String(sub.student) === sid);
        if (sub) history.push({ date: sub.submittedAt || t.date, score: sub.marks || 0 });
      });
      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      let trend = "stable";
      if (history.length >= 2) {
        const recent = history.slice(0, Math.ceil(history.length / 2));
        const old = history.slice(Math.ceil(history.length / 2));
        const avgRecent = recent.reduce((s, i) => s + i.score, 0) / recent.length;
        const avgOld = old.reduce((s, i) => s + i.score, 0) / old.length;
        if (avgRecent > avgOld + 5) trend = "up";
        else if (avgRecent < avgOld - 5) trend = "down";
      }

      results.push({
        id: s._id,
        name: s.user?.name || "Student",
        class: classNames[0] || "General", // Primary class
        attendance: attendancePct,
        assignments: {
          completed: submittedAssig.length,
          total: relevantAssignments.length,
          avgScore: assigAvg
        },
        tests: {
          completed: submittedTests.length,
          total: relevantTests.length,
          avgScore: testAvg
        },
        trend
      });
    }

    res.json(results);
  } catch (e) {
    console.error("Progress list error:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/tutor/progress/:id - detailed student history
router.get("/progress/:id", protect, authorize("tutor"), async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId).populate('user', 'name email');
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch history
    // 1. Assignments
    const assignments = await require("../models/Assignment").find({ "submissions.student": studentId });
    // 2. Tests
    const tests = await require("../models/Test").find({ "submissions.student": studentId });

    const history = [];
    for (const a of assignments) {
      const sub = a.submissions.find(s => String(s.student) === studentId);
      history.push({
        id: a._id,
        date: sub.submittedAt || a.dueDate,
        type: "Assignment",
        title: a.title,
        score: parseFloat(sub.grade) || 0,
        maxScore: 100, // Default
        feedback: "" // No feedback field in schema yet
      });
    }
    for (const t of tests) {
      const sub = t.submissions.find(s => String(s.student) === studentId);
      history.push({
        id: t._id,
        date: t.date,
        type: "Test",
        title: t.title,
        score: sub.marks || 0,
        maxScore: 100, // Default
        feedback: ""
      });
    }

    // Sort by date desc
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      id: student._id,
      name: student.user?.name,
      class: "General", // Placeholder or fetch from enrollment
      attendance: 0, // Calculated in summary, can recalc here if needed
      notes: "No notes available.", // Schema doesn't have notes
      history
    });
  } catch (e) {
    console.error("Student detail error:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
