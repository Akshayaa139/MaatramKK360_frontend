const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const repairStudents = async () => {
    await connectDB();
    console.log("Starting repair of assigned students missing from classes...");

    // Find students who have a tutor assigned
    const students = await Student.find({ tutor: { $exists: true, $ne: null } }).populate('user');
    console.log(`Found ${students.length} students with assigned tutors.`);

    let fixedCount = 0;

    for (const s of students) {
        try {
            const tutorId = s.tutor;
            const tutor = await Tutor.findById(tutorId).populate('user');

            if (!tutor) {
                console.log(`[WARNING] Student ${s.user?.name} (${s._id}) has non-existent tutor: ${tutorId}`);
                continue;
            }

            // Check if student is in any class for this tutor
            // We use findOne because we just need to know if ONE exists.
            // If they are in multiple, that's fine.
            const classes = await Class.find({ tutor: tutorId });
            let isEnrolled = false;
            let targetClass = null;

            // Simple check
            for (const cls of classes) {
                if (cls.students.map(String).includes(String(s._id))) {
                    isEnrolled = true;
                    break;
                }
            }

            if (isEnrolled) {
                // All good
                continue;
            }

            console.log(`Fixing Student ${s.user?.name} (ID: ${s._id}) - Assigned to ${tutor.user?.name} but not in class.`);

            // Need to add to a class.
            // Pick best class by subject?
            const subject = (s.subjects && s.subjects[0]) ? s.subjects[0] : "General";

            // Try matching class
            targetClass = classes.find(c => c.subject && c.subject.toLowerCase() === subject.toLowerCase());

            // Fallback to most recent class
            if (!targetClass && classes.length > 0) {
                targetClass = classes.sort((a, b) => b.createdAt - a.createdAt)[0];
            }

            if (!targetClass) {
                // Create new class
                console.log(`  -> Creating NEW class for ${subject}`);
                targetClass = await Class.create({
                    title: `${subject} - ${tutor.user?.name || 'Tutor'}`,
                    subject: subject,
                    tutor: tutorId,
                    students: [],
                    schedule: { day: 'Monday', startTime: '18:00', endTime: '19:00' },
                    status: 'scheduled'
                });
            }

            // Enroll
            targetClass.students.push(s._id);
            await targetClass.save();
            console.log(`  -> Enrolled in ${targetClass.title}`);
            fixedCount++;

        } catch (err) {
            console.error(`Error processing student ${s._id}:`, err);
        }
    }

    console.log(`Repair complete. Fixed ${fixedCount} student enrollments.`);
    process.exit();
};

repairStudents();
