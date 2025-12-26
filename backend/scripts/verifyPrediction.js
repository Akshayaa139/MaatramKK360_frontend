/**
 * Manual Test for Prediction Logic in studentAnalyticsService.js
 * Mocking the models for verification.
 */

// Mock data
const mockStudent = {
    _id: "student123",
    user: { name: "Test Student" },
    attendance: [
        { status: "present" },
        { status: "absent" },
        { status: "present" }
    ] // 66.6% attendance
};

const mockAssignments = [
    { submissions: [{ student: "student123", grade: "80" }] },
    { submissions: [{ student: "student123", grade: "90" }] }
]; // 85% assignment average

const mockTests = [
    { submissions: [{ student: "student123", marks: 70 }] },
    { submissions: [{ student: "student123", marks: 60 }] }
]; // 65% test average

// Composite Score Calculation Logic (Copy from service for testing)
const testPrediction = (attendance, assignments, tests) => {
    const presentCount = attendance.filter(a => a.status === "present").length;
    const totalAttendance = attendance.length;
    const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;

    let totalAssignmentScore = 0;
    let scoredAssignments = 0;
    assignments.forEach(a => {
        a.submissions.forEach(s => {
            const score = parseFloat(s.grade);
            if (!isNaN(score)) {
                totalAssignmentScore += score;
                scoredAssignments++;
            }
        });
    });
    const assignmentAvg = scoredAssignments ? (totalAssignmentScore / scoredAssignments) : 0;

    let totalTestScore = 0;
    let scoredTests = 0;
    tests.forEach(t => {
        t.submissions.forEach(s => {
            if (typeof s.marks === 'number') {
                totalTestScore += s.marks;
                scoredTests++;
            }
        });
    });
    const testAvg = scoredTests ? (totalTestScore / scoredTests) : 0;

    const compositeScore = (testAvg * 0.4) + (assignmentAvg * 0.3) + (attendanceRate * 0.3);

    let dropoutRisk = "Perfect";
    if (totalAttendance === 0 && scoredAssignments === 0 && scoredTests === 0) {
        dropoutRisk = "No Data";
    } else if (compositeScore < 40) {
        dropoutRisk = "Sure Dropout";
    } else if (compositeScore < 70) {
        dropoutRisk = "Maybe Dropout";
    }

    return { attendanceRate, assignmentAvg, testAvg, compositeScore, dropoutRisk };
};

console.log("Scenario 1: Good Student");
console.log(testPrediction(mockStudent.attendance, mockAssignments, mockTests));

console.log("\nScenario 2: Low Performance Student");
const lowAssignments = [{ submissions: [{ student: "student123", grade: "30" }] }];
const lowTests = [{ submissions: [{ student: "student123", marks: 20 }] }];
const lowAttendance = [{ status: "absent" }, { status: "absent" }];
console.log(testPrediction(lowAttendance, lowAssignments, lowTests));

console.log("\nScenario 3: No Data Student");
console.log(testPrediction([], [], []));
