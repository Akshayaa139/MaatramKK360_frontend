const Student = require("../models/Student");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const Class = require("../models/Class");

/**
 * Calculates student progress and predicts dropout risk.
 * @param {string} studentId 
 * @param {Object} [preFetchedData] - Optional pre-fetched data to avoid N+1 queries
 * @param {Array} [preFetchedData.classes] 
 * @param {Array} [preFetchedData.assignments]
 * @param {Array} [preFetchedData.tests]
 */
const calculateStudentProgress = async (studentId, preFetchedData = {}) => {
  const student = await Student.findById(studentId).populate('user', 'name');
  if (!student) return { dropoutRisk: "No Student Found" };

  const name = student.user?.name || "Student";
  
  // Use pre-fetched data if available, otherwise query
  const classes = preFetchedData.classes || await Class.find({ students: studentId });
  const classIds = classes.map((c) => String(c._id));

  // 1. Attendance Rate
  const attendance = Array.isArray(student.attendance) ? student.attendance : [];
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;

  // 2. Assignment Scores
  const assignments = preFetchedData.assignments || await Assignment.find({ class: { $in: classIds } });
  
  // Filter assignments that belong to the student's classes (if pre-fetched data contains more)
  const studentAssignments = preFetchedData.assignments 
    ? assignments.filter(a => classIds.includes(String(a.class)))
    : assignments;

  const assignmentTotal = studentAssignments.length;
  const submissions = studentAssignments.flatMap(a => (a.submissions || []).filter(s => String(s.student) === String(studentId)));
  const assignmentCompleted = submissions.length;

  let totalAssignmentScore = 0;
  let scoredAssignments = 0;
  submissions.forEach(s => {
    const score = parseFloat(s.grade);
    if (!isNaN(score)) {
      totalAssignmentScore += score;
      scoredAssignments++;
    }
  });
  const assignmentAvg = scoredAssignments ? (totalAssignmentScore / scoredAssignments) : 0;

  // 3. Test Scores
  const tests = preFetchedData.tests || await Test.find({ class: { $in: classIds } });
  
  // Filter tests that belong to the student's classes (if pre-fetched data contains more)
  const studentTests = preFetchedData.tests 
    ? tests.filter(t => classIds.includes(String(t.class)))
    : tests;

  const testTotal = studentTests.length;
  const testSubmissions = studentTests.flatMap(t => (t.submissions || []).filter(s => String(s.student) === String(studentId)));
  const testCompleted = testSubmissions.length;

  let totalTestScore = 0;
  let scoredTests = 0;
  testSubmissions.forEach(s => {
    if (typeof s.marks === 'number') {
      totalTestScore += s.marks;
      scoredTests++;
    }
  });
  const testAvg = scoredTests ? (totalTestScore / scoredTests) : 0;

  // 4. Trend Calculation
  // Combine all scores to see trend
  const allSubmissions = [
    ...submissions.map(s => ({ score: (parseFloat(s.grade) || 0), date: s.submittedAt })),
    ...testSubmissions.map(s => ({ score: (s.marks || 0), date: s.date }))
  ].filter(s => s.date).sort((a, b) => new Date(a.date) - new Date(b.date));

  let trend = "stable";
  if (allSubmissions.length >= 2) {
    const lastTwo = allSubmissions.slice(-2);
    const lastAvg = (lastTwo[0].score + lastTwo[1].score) / 2;
    const overallAvg = (testAvg + assignmentAvg) / 2 || 0;

    if (lastAvg > overallAvg + 5) trend = "up";
    else if (lastAvg < overallAvg - 5) trend = "down";
  }

  // Composite Score Calculation (Weighted: 40% Tests, 30% Assignments, 30% Attendance)
  const compositeScore = (testAvg * 0.4) + (assignmentAvg * 0.3) + (attendanceRate * 0.3);

  // Prediction Logic
  let dropoutRisk = "Perfect";
  if (compositeScore < 40) {
    dropoutRisk = "Sure Dropout";
  } else if (compositeScore < 70) {
    dropoutRisk = "Maybe Dropout";
  }

  // Diagnostic Fallback
  if (totalAttendance === 0 && scoredAssignments === 0 && scoredTests === 0) {
    dropoutRisk = `No Data (Att:${totalAttendance}, Ass:${scoredAssignments}, Tst:${scoredTests})`;
  } else if (totalAttendance > 0 && scoredAssignments === 0 && scoredTests === 0 && attendanceRate >= 70) {
    dropoutRisk = "Perfect";
  } else if (totalAttendance > 0 && scoredAssignments === 0 && scoredTests === 0 && attendanceRate < 40) {
    dropoutRisk = "Sure Dropout";
  }

  return {
    studentId,
    name,
    attendanceRate,
    assignmentAvg,
    assignmentCompleted,
    assignmentTotal,
    testAvg,
    testCompleted,
    testTotal,
    trend,
    compositeScore,
    dropoutRisk
  };
};

module.exports = {
  calculateStudentProgress
};
