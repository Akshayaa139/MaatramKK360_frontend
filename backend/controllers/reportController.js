const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const Class = require("../models/Class");
const Tutor = require("../models/Tutor");
const User = require("../models/User");
const Discussion = require("../models/Discussion");
const Feedback = require("../models/Feedback");
const Announcement = require("../models/Announcement");
const MentoringSession = require("../models/MentoringSession");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Helper to draw header
const drawHeader = (doc, title, subtitle) => {
    // Logo placeholder or text
    doc.fontSize(20).text("Karpom Karpippom", 50, 50, { align: "left" });
    doc.fontSize(10).text("Maatram Foundation", 50, 75, { align: "left" });

    doc.fontSize(24).text(title, 50, 120, { align: "center", underline: true });
    if (subtitle) {
        doc.fontSize(14).text(subtitle, 50, 150, { align: "center" });
    }
    doc.moveDown(2);
};

// @desc    Generate Student Progress Report PDF
// @route   GET /api/reports/student/:id
// @access  Private/Tutor, Admin
const generateStudentReport = asyncHandler(async (req, res) => {
    const searchId = req.params.id;
    let student = null;

    // Try finding by direct Student ID
    if (mongoose.Types.ObjectId.isValid(searchId)) {
        student = await Student.findById(searchId).populate("user", "name email");
    }

    // If not found, try finding via Application Linkage (searching Application ID)
    if (!student) {
        const Application = require("../models/Application");
        const app = await Application.findOne({
            $or: [{ applicationNumber: searchId }, { applicationId: searchId }, { _id: mongoose.Types.ObjectId.isValid(searchId) ? searchId : null }].filter(x => x._id !== null)
        });

        if (app) {
            const email = app.personalInfo?.email || app.email;
            const User = require("../models/User");
            const user = await User.findOne({
                $or: [{ email }, { "personalInfo.email": email }]
            });
            if (user) {
                student = await Student.findOne({ user: user._id }).populate("user", "name email");
            }
        }
    }

    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }
    const studentId = student._id;

    // Fetch Stats
    const classes = await Class.find({ students: student._id }).select("_id title");
    const classIds = classes.map((c) => c._id);
    const assignments = await Assignment.find({ class: { $in: classIds } });
    const tests = await Test.find({ class: { $in: classIds } });

    // Calculate Aggregates
    let assigScore = 0, assigCount = 0;
    assignments.forEach(a => {
        const sub = (a.submissions || []).find(s => String(s.student) === studentId && s.grade);
        if (sub) {
            assigScore += parseFloat(sub.grade) || 0;
            assigCount++;
        }
    });
    const avgAssig = assigCount ? Math.round(assigScore / assigCount) : 0;

    let testScore = 0, testCount = 0;
    tests.forEach(t => {
        const sub = (t.submissions || []).find(s => String(s.student) === studentId && (s.marks !== undefined));
        if (sub) {
            testScore += (sub.marks || 0);
            testCount++;
        }
    });
    const avgTest = testCount ? Math.round(testScore / testCount) : 0;
    const overall = Math.round((avgAssig + avgTest) / 2);

    const att = student.attendance || [];
    const totalAtt = att.length;
    const present = att.filter(a => a.status === 'present').length;
    const attRate = totalAtt ? Math.round((present / totalAtt) * 100) : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    const fileName = student.user?.name ? student.user.name.replace(/\s+/g, "_") : `Student_${student._id}`;
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=Report_${fileName}.pdf`
    );

    doc.pipe(res);

    drawHeader(doc, "Student Progress Report", `For: ${student.user?.name || 'Unknown Student'} | Grade: ${student.grade || 'N/A'}`);

    // Summary Table
    const startY = 200;
    doc.fontSize(12).text("Performance Summary", 50, startY);

    const drawRow = (y, label, value) => {
        doc.text(label, 70, y);
        doc.text(value, 300, y);
    };

    drawRow(startY + 20, "Attendance Rate:", `${attRate}%`);
    drawRow(startY + 40, "Assignments Completed:", `${assigCount}/${assignments.length}`);
    drawRow(startY + 60, "Average Assignment Score:", `${avgAssig}%`);
    drawRow(startY + 80, "Tests Completed:", `${testCount}/${tests.length}`);
    drawRow(startY + 100, "Average Test Score:", `${avgTest}%`);

    // Add Mentoring & Performance Data
    const mentoringCount = await MentoringSession.countDocuments({ student: student._id });
    drawRow(startY + 120, "Mentoring Sessions:", String(mentoringCount));

    doc.font('Helvetica-Bold').text("Overall Grade: " + overall + "%", 70, startY + 160);
    doc.font('Helvetica');

    // School Performance
    if (student.performance && student.performance.length > 0) {
        doc.addPage();
        drawHeader(doc, "Academic Performance", `Student: ${student.user?.name}`);
        let py = 200;
        doc.fontSize(12).text("School Exam Records", 50, py, { underline: true });
        py += 30;

        student.performance.forEach(p => {
            if (py > 700) { doc.addPage(); py = 50; }
            doc.fontSize(10).text(`${p.subject} (${p.examType}): ${p.score}/${p.maxScore} - ${new Date(p.testDate).toLocaleDateString()}`, 70, py);
            py += 20;
        });
    }

    // Recent Activity
    doc.fontSize(14).text("Recent Activity", 50, startY + 210, { underline: true });

    let currentY = startY + 220;

    // Combine History
    const history = [];
    assignments.forEach(a => {
        const sub = (a.submissions || []).find(s => String(s.student) === studentId);
        if (sub) history.push({ date: sub.submittedAt || a.dueDate, title: a.title, type: "Assignment", score: sub.grade });
    });
    tests.forEach(t => {
        const sub = (t.submissions || []).find(s => String(s.student) === studentId);
        if (sub) history.push({ date: t.date, title: t.title, type: "Test", score: sub.marks });
    });
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit query
    const recent = history.slice(0, 10);

    recent.forEach(item => {
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
        const dateStr = new Date(item.date).toLocaleDateString();
        doc.fontSize(10).text(`${dateStr} - [${item.type}] ${item.title}: ${item.score || 'N/A'}`, 70, currentY);
        currentY += 20;
    });

    if (student.notes) {
        currentY += 30;
        doc.fontSize(12).text("Tutor Notes:", 50, currentY, { underline: true });
        doc.fontSize(10).text(student.notes, 50, currentY + 20);
    }

    doc.end();
});

// @desc    Generate Class Report PDF
// @route   GET /api/reports/class
// @access  Private/Tutor, Admin
const generateClassReport = asyncHandler(async (req, res) => {
    const classId = req.params.id;
    const { className } = req.query;

    let query = {};
    if (classId && mongoose.Types.ObjectId.isValid(classId)) query._id = classId;
    else if (className && className !== 'all') query.title = className;
    else {
        return res.status(400).json({ message: "Valid Class ID or Name required" });
    }

    const cls = await Class.findOne(query);
    if (!cls) {
        res.status(404);
        throw new Error("Class not found");
    }

    const students = await Student.find({ "attendance.class": cls._id }).populate("user", "name email");
    const assignments = await Assignment.find({ class: cls._id });
    const tests = await Test.find({ class: cls._id });

    // Class Stats
    let totalClassScore = 0;
    let totalStudentsWithScore = 0;

    const studentStats = students.map(student => {
        let sAssigScore = 0, sAssigCount = 0;
        assignments.forEach(a => {
            const sub = (a.submissions || []).find(s => String(s.student) === String(student._id) && s.grade);
            if (sub) {
                sAssigScore += parseFloat(sub.grade) || 0;
                sAssigCount++;
            }
        });
        const avgAssig = sAssigCount ? Math.round(sAssigScore / sAssigCount) : 0;

        let sTestScore = 0, sTestCount = 0;
        tests.forEach(t => {
            const sub = (t.submissions || []).find(s => String(s.student) === String(student._id) && (s.marks !== undefined));
            if (sub) {
                sTestScore += (sub.marks || 0);
                sTestCount++;
            }
        });
        const avgTest = sTestCount ? Math.round(sTestScore / sTestCount) : 0;
        const overall = (sAssigCount || sTestCount) ? Math.round((avgAssig + avgTest) / ((sAssigCount ? 1 : 0) + (sTestCount ? 1 : 0))) : 0; // Simple average of available components

        if (sAssigCount || sTestCount) {
            totalClassScore += overall;
            totalStudentsWithScore++;
        }

        const classAtt = student.attendance.filter(a => String(a.class) === String(cls._id));
        const present = classAtt.filter(a => a.status === 'present').length;
        const attRate = classAtt.length ? Math.round((present / classAtt.length) * 100) : 0;

        return {
            name: student.user.name,
            id: student._id,
            overall,
            attRate
        };
    });

    const classAvg = totalStudentsWithScore ? Math.round(totalClassScore / totalStudentsWithScore) : 0;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=Class_Report_${cls.title.replace(/\s+/g, "_")}.pdf`
    );
    doc.pipe(res);

    drawHeader(doc, "Class Progress Report", `Class: ${cls.title}`);

    doc.fontSize(12).text(`Class Average Score: ${classAvg}%`, 50, 180);
    doc.text(`Total Students: ${students.length}`, 50, 200);

    // Student Table
    let y = 240;
    doc.fontSize(12).text("Student List", 50, y, { underline: true });
    y += 30;

    doc.fontSize(10);
    doc.text("Name", 50, y);
    doc.text("Attendance", 250, y);
    doc.text("Overall Grade", 400, y);
    y += 20;

    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    studentStats.forEach(s => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
        doc.text(s.name, 50, y);
        doc.text(s.attRate + "%", 250, y);
        doc.text(s.overall + "%", 400, y);
        y += 20;
    });

    doc.end();
});

// @desc    Generate Tutor Performance Report PDF
// @route   GET /api/reports/tutor/:id
// @access  Private/Admin
const generateTutorReport = asyncHandler(async (req, res) => {
    const tutorId = req.params.id;
    const tutor = await Tutor.findById(tutorId).populate("user", "name email phone");

    if (!tutor) {
        res.status(404);
        throw new Error("Tutor not found");
    }

    const classes = await Class.find({ tutor: tutor._id }).populate("students");

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Tutor_Report_${tutor.user.name.replace(/\s+/g, "_")}.pdf`);
    doc.pipe(res);

    drawHeader(doc, "Tutor Performance Report", `Tutor: ${tutor.user.name}`);

    // Basic Info
    doc.fontSize(14).text("Tutor Profile", 50, 180, { underline: true });
    doc.fontSize(10).text(`Email: ${tutor.user?.email || 'N/A'}`, 50, 205);
    doc.fontSize(10).text(`Subjects: ${(tutor.subjects || []).join(", ")}`, 50, 220);
    doc.fontSize(10).text(`Qualifications: ${tutor.qualifications || 'N/A'}`, 50, 235);

    // Classes Summary
    doc.fontSize(14).text("Assigned Classes", 50, 270, { underline: true });

    let y = 300;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Class Title", 50, y);
    doc.text("Students", 250, y);
    doc.text("Avg. Attendance", 350, y);
    doc.font("Helvetica");
    y += 20;
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    for (const cls of classes) {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // Calculate average attendance for this class across all its students
        let totalAtt = 0;
        let presentAtt = 0;
        cls.students.forEach(s => {
            const classAtt = (s.attendance || []).filter(a => String(a.class) === String(cls._id));
            totalAtt += classAtt.length;
            presentAtt += classAtt.filter(a => a.status === 'present').length;
        });
        const classAvgAtt = totalAtt ? Math.round((presentAtt / totalAtt) * 100) : 0;

        doc.text(cls.title, 50, y);
        doc.text(String(cls.students.length), 250, y);
        doc.text(`${classAvgAtt}%`, 350, y);
        y += 20;
    }

    // Detailed Engagement
    y += 20;
    doc.fontSize(14).text("Engagement & Activity", 50, y, { underline: true });
    y += 30;

    const announcementsCount = await Announcement.countDocuments({ author: tutor.user._id });
    const discussionsCount = await Discussion.countDocuments({ author: tutor.user._id });
    const feedbacks = await Feedback.find({ tutor: tutor.user._id });
    const avgRating = feedbacks.length ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : "N/A";
    const mentoringConducted = await MentoringSession.countDocuments({ tutor: tutor.user._id });

    doc.fontSize(10);
    doc.text(`Announcements Sent: ${announcementsCount}`, 70, y);
    doc.text(`Discussion Posts: ${discussionsCount}`, 70, y + 20);
    doc.text(`Mentoring Sessions Conducted: ${mentoringConducted}`, 70, y + 40);
    doc.text(`Average Student Rating: ${avgRating}/5.0 (${feedbacks.length} feedbacks)`, 70, y + 60);

    doc.end();
});

// @desc    Generate Global Platform Report PDF
// @route   GET /api/reports/global
// @access  Private/Admin
const generateGlobalReport = asyncHandler(async (req, res) => {
    const totalStudents = await Student.countDocuments();
    const totalTutors = await Tutor.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: { $in: ['volunteer', 'alumni'] } });
    const totalApplications = await require("../models/Application").countDocuments();
    const totalDiscussions = await Discussion.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Global_Platform_Report.pdf");
    doc.pipe(res);

    drawHeader(doc, "Global Platform Report", "Karpom Karpippom 360 - Comprehensive Overview");

    const startY = 200;
    doc.fontSize(16).text("System-wide Statistics", 50, startY, { underline: true });

    let y = startY + 40;
    const drawStat = (label, value) => {
        doc.fontSize(12).text(label, 70, y);
        doc.fontSize(12).text(String(value), 350, y);
        y += 30;
    };

    drawStat("Total Students Registered:", totalStudents);
    drawStat("Total Tutors Enrolled:", totalTutors);
    drawStat("Total Volunteers / Alumni:", totalVolunteers);
    drawStat("Total Classes Created:", totalClasses);
    drawStat("Total Applications Processed:", totalApplications);
    drawStat("Community Engagement (Discussions):", totalDiscussions);
    drawStat("Student Feedback Received:", totalFeedback);

    // Add a summary section
    y += 20;
    doc.fontSize(14).text("System Status: Operational", 50, y);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, 50, y + 30);

    doc.end();
});

module.exports = {
    generateStudentReport,
    generateClassReport,
    generateGlobalReport,
    generateTutorReport
};
