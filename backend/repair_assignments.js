const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Application = require('./models/Application');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

function log(msg) {
    console.log(msg);
    fs.appendFileSync('repair_output.txt', msg + '\n');
}

const createOrFindStudent = async (app) => {
    const email = app.personalInfo?.email || app.email;
    const name = app.personalInfo?.fullName || app.studentName || app.name;
    const phone = app.personalInfo?.phone || app.phone;

    let user = await User.findOne({ email });
    if (!user) {
        log(`Creating User for ${name} (${email})`);
        user = await User.create({
            name,
            email,
            password: "Welcome@123", // Default password
            role: "student",
            phone
        });
    }

    let student = await Student.findOne({ user: user._id });
    if (!student) {
        log(`Creating Student profile for ${name}`);
        const educational = app.educationalInfo || {};
        const subjects = Array.isArray(educational.subjects)
            ? educational.subjects.map(s => s.name || s)
            : [];

        student = await Student.create({
            user: user._id,
            grade: educational.currentClass || "Unknown",
            subjects
        });
    }
    return student;
};

const run = async () => {
    try {
        fs.writeFileSync('repair_output.txt', 'Starting repair...\n');
        await mongoose.connect(process.env.MONGODB_URI);

        const tutorEmail = "susi123@gmail.com";
        const susiUser = await User.findOne({ email: tutorEmail });
        if (!susiUser) { log("Susi not found"); return; }
        const susiTutor = await Tutor.findOne({ user: susiUser._id });
        if (!susiTutor) { log("Susi Tutor profile not found"); return; }

        log(`Target Tutor: ${susiTutor._id} (Susi)`);

        // List of students to FORCE assign to Susi
        // Based on User request to match Admin dashboard
        const targets = ["Guru", "Abinaya", "nanthu", "dharshini"]; // For Math

        for (const name of targets) {
            log(`\nProcessing ${name}...`);
            const app = await Application.findOne({
                $or: [
                    { "personalInfo.fullName": { $regex: name, $options: 'i' } },
                    { "studentName": { $regex: name, $options: 'i' } }
                ]
            });

            if (!app) {
                log("Application not found, skipping.");
                continue;
            }

            // 1. Ensure Student Record Exists
            const student = await createOrFindStudent(app);
            log(`Student ID: ${student._id}`);

            // 2. Find or Create Math Class with Susi
            const subject = "Mathematics"; // Assuming Math for all as per screenshot context or creating new class
            let cls = await Class.findOne({
                tutor: susiTutor._id,
                subject: { $regex: subject, $options: 'i' }
            });

            if (!cls) {
                log(`Creating new ${subject} class for Susi`);
                cls = await Class.create({
                    title: `${subject} - Susi`,
                    subject: "Mathematics",
                    tutor: susiTutor._id,
                    students: [],
                    schedule: { day: "Monday", startTime: "18:00", endTime: "19:00" },
                    status: "scheduled",
                    sessionLink: "https://meet.google.com/kk-class-susi-math"
                });
            }

            // 3. Assign Student to Class
            const isEnrolled = cls.students.some(id => id.toString() === student._id.toString());
            if (!isEnrolled) {
                log(`Enrolling student into class ${cls._id}`);
                cls.students.push(student._id);
                await cls.save();
            } else {
                log("Student already in class");
            }

            // 4. Update Application Assignment
            app.tutorAssignment = {
                tutor: susiTutor._id,
                meetingLink: cls.sessionLink,
                schedule: cls.schedule
            };
            await app.save();
            log("Updated Application assignment");
        }

    } catch (e) {
        log(`ERROR: ${e}`);
    } finally {
        mongoose.disconnect();
    }
};

run();
