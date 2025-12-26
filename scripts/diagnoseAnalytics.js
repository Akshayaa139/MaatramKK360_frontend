const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const studentAnalytics = require('../backend/services/studentAnalyticsService');
const Student = require('../backend/models/Student');

async function diagnose() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kk360');
        console.log("Connected.");

        const student = await Student.findOne({ "attendance.0": { $exists: true } });
        if (!student) {
            console.log("No student found with attendance data.");
            const anyStudent = await Student.findOne();
            if (anyStudent) {
                console.log(`Found a student without attendance: ${anyStudent._id}`);
                const result = await studentAnalytics.calculateStudentProgress(anyStudent._id);
                console.log("Analytics result:", JSON.stringify(result, null, 2));
            } else {
                console.log("No students found in database at all.");
            }
        } else {
            console.log(`Found student with attendance: ${student._id}`);
            console.log(`Attendance count: ${student.attendance.length}`);
            const result = await studentAnalytics.calculateStudentProgress(student._id);
            console.log("Analytics result:", JSON.stringify(result, null, 2));
        }

    } catch (err) {
        console.error("Diagnostic failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
