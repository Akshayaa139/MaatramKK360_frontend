const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const Class = require("../models/Class");
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
    const studentId = req.params.id;
    const student = await Student.findById(studentId).populate("user", "name email");

    if (!student) {
        res.status(404);
        throw new Error("Student not found");
    }

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
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=Report_${student.user.name.replace(/\s+/g, "_")}.pdf`
    );

    doc.pipe(res);

    drawHeader(doc, "Student Progress Report", `For: ${student.user.name} | Grade: ${student.grade}`);

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

    doc.font('Helvetica-Bold').text("Overall Grade: " + overall + "%", 70, startY + 140);
    doc.font('Helvetica');

    // Recent Activity
    doc.fontSize(14).text("Recent Activity", 50, startY + 190, { underline: true });

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
    const { classId, className } = req.query;

    let query = {};
    if (classId) query._id = classId;
    else if (className && className !== 'all') query.title = className;
    else {
        // If no specific class, maybe return error or generate for all?
        // For now, require a class
        return res.status(400).json({ message: "Class ID or Name required" });
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

module.exports = {
    generateStudentReport,
    generateClassReport
};
