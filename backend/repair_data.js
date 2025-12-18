const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Application = require('./models/Application');
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

const repair = async () => {
    await connectDB();
    console.log("Starting repair of student-class linkages...");

    // Find all selected applications with an assigned tutor
    const apps = await Application.find({
        status: 'selected',
        'tutorAssignment.tutor': { $exists: true }
    });

    console.log(`Found ${apps.length} selected applications.`);
    let fixedCount = 0;

    for (const app of apps) {
        try {
            const email = app.personalInfo?.email || app.email;
            let tutorId = app.tutorAssignment.tutor;

            if (!email || !tutorId) continue;

            // 1. Validate/Fix Tutor ID
            let tutor = await Tutor.findById(tutorId);
            if (!tutor) {
                // Check if it's a User ID
                const tutorByUser = await Tutor.findOne({ user: tutorId });
                if (tutorByUser) {
                    console.log(`Fixing ID mismatch for app ${app._id}: Found UserID ${tutorId}, swapping for TutorID ${tutorByUser._id}`);
                    app.tutorAssignment.tutor = tutorByUser._id;
                    await app.save();
                    tutorId = tutorByUser._id;
                    tutor = tutorByUser;
                    fixedCount++;
                } else {
                    console.log(`Skipping app ${app._id}: TutorID ${tutorId} not found`);
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
                console.log(`Student profile missing for user ${user.email}`);
                continue;
            }

            // 3. Ensure Class exists for this TUTOR
            // We need to match the subject if possible, or just pick the most recent one
            // The controller logic used sort({ createdAt: -1 })
            const subject = app.educationalInfo?.subjects?.[0]?.name || app.educationalInfo?.subjects?.[0] || "General";

            // Try to find class by subject first
            let cls = await Class.findOne({
                tutor: tutorId,
                subject: { $regex: new RegExp(subject, 'i') }
            });

            if (!cls) {
                // Fallback to any class
                cls = await Class.findOne({ tutor: tutorId }).sort({ createdAt: -1 });
            }

            if (!cls) {
                await tutor.populate('user');
                console.log(`Creating NEW class for tutor ${tutor.user?.name} (${subject})`);
                cls = await Class.create({
                    title: `${subject} - ${tutor.user?.name || 'Tutor'}`,
                    subject: subject,
                    tutor: tutorId,
                    students: [],
                    schedule: { day: 'Monday', startTime: '18:00', endTime: '19:00' },
                    status: 'scheduled'
                });
                fixedCount++;
            }

            // 4. Enroll Student
            const isEnrolled = cls.students.some(s => String(s) === String(student._id));
            if (!isEnrolled) {
                console.log(`Enrolling ${user.name} into class ${cls.title} (${cls._id})`);
                cls.students.push(student._id);
                await cls.save();
                fixedCount++;
            }

            // Double check: if multiple classes exist, ensure student is not in NONE of them?
            // Current logic just ensures they are in AT LEAST ONE (the best matching one).

        } catch (err) {
            console.error(`Error processing app ${app._id}: ${err.message}`);
        }
    }

    console.log(`Repair complete. Fixed ${fixedCount} issues.`);
    process.exit();
};

repair();
