const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
// Try default first (cwd) then explicit path
const envPath = path.join(__dirname, '../.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    console.log("MONGO_URI/MONGODB_URI not found using path. Trying default .env in CWD...");
    dotenv.config();
}

console.log("DB URI is set:", !!(process.env.MONGODB_URI || process.env.MONGO_URI));

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Application = require('../models/Application');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');
const User = require('../models/User');

const norm = (s) => String(s || "").trim().toLowerCase();

const runRepair = async () => {
    await connectDB();

    console.log("Starting repair of student-class linkages...");

    // 1. Find all applications that are "selected" and have a tutor assigned
    const apps = await Application.find({
        status: 'selected',
        'tutorAssignment.tutor': { $exists: true }
    });

    console.log(`Found ${apps.length} assigned applications.`);

    let fixedCount = 0;

    for (const app of apps) {
        try {
            const email = app.personalInfo?.email || app.email;
            const tutorId = app.tutorAssignment.tutor;

            if (!email || !tutorId) continue;

            // Find Student
            const user = await User.findOne({
                $or: [{ email: email }, { 'personalInfo.email': email }]
            });

            if (!user) {
                console.log(`User not found for app ${app._id} (${email})`);
                continue;
            }

            const student = await Student.findOne({ user: user._id });
            if (!student) {
                console.log(`Student profile not found for user ${user._id}`);
                continue;
            }

            // Find Class for Tutor
            // We look for a class that matches the Tutors ID. 
            // In the codebase, classes are loosely matched by subject/tutor, 
            // but we need to ensure the student is in AT LEAST one class with this tutor.

            const educational = app.educationalInfo || {};
            const subjects = Array.isArray(educational.subjects)
                ? educational.subjects.map((x) => x?.name || x)
                : ["General"];
            const subject = subjects[0] || "General";

            // Find existing class for tutor + subject
            let cls = await Class.findOne({
                tutor: tutorId,
                // Flexible subject matching or match all
                // identifying class by tutor is safer for now
            }).sort({ createdAt: -1 }); // Get most recent

            if (!cls) {
                console.log(`No class found for Tutor ${tutorId}. Creating one...`);
                // Create a catch-all class for this tutor
                const tutor = await Tutor.findById(tutorId).populate('user');
                if (!tutor) continue;

                cls = await Class.create({
                    title: `${subject} - ${tutor.user?.name || 'Tutor'}`,
                    subject: subject,
                    tutor: tutorId,
                    students: [],
                    schedule: {
                        day: 'Monday',
                        startTime: '10:00',
                        endTime: '11:00'
                    },
                    status: 'scheduled'
                });
                console.log(`Created new class ${cls._id}`);
            }

            // Check if student is in class
            const isEnrolled = cls.students.some(s => String(s) === String(student._id));

            if (!isEnrolled) {
                cls.students.push(student._id);
                await cls.save();
                console.log(`Enrolled student ${student._id} (${user.name}) into class ${cls._id}`);
                fixedCount++;
            }

        } catch (err) {
            console.error(`Error processing app ${app._id}:`, err.message);
        }
    }

    console.log(`Repair complete. Fixed ${fixedCount} linkages.`);
    process.exit();
};

runRepair();
