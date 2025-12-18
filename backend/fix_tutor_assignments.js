const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Models
const Application = require('./models/Application');
const Student = require('./models/Student');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const User = require('./models/User');

dotenv.config();

const fixAssignments = async () => {
    await connectDB();

    try {
        console.log('--- Starting Assignment Fix ---');
        const apps = await Application.find({ status: 'selected' });
        console.log(`Found ${apps.length} selected applications.`);

        let fixedCount = 0;

        for (const app of apps) {
            console.log(`Processing App: ${app.applicationNumber} (${app.personalInfo?.fullName || app.name})`);

            // 1. Find Student
            const email = app.personalInfo?.email || app.email;
            if (!email) continue;

            const user = await User.findOne({
                $or: [{ email: email }, { "personalInfo.email": email }]
            });

            if (!user) {
                console.log(`  User not found for ${email}`);
                continue;
            }

            const student = await Student.findOne({ user: user._id });
            if (!student) {
                console.log(`  Student record not found for ${user.name}`);
                continue;
            }

            // 2. Iterate Subjects
            const educational = app.educationalInfo || {};
            const subjects = Array.isArray(educational.subjects) ? educational.subjects.map(x => x?.name || x) : [];

            for (const subject of subjects) {
                // Check if class exists
                const existingClass = await Class.findOne({
                    students: student._id,
                    subject: subject
                });

                if (existingClass) {
                    // console.log(`  [OK] Class exists for ${subject}`);
                    continue;
                }

                console.log(`  [MISSING] No class for ${subject}. Assigning...`);

                // 3. Find Best Tutor (Load Balancing)
                let tutors = await Tutor.find({ subjects: subject, status: { $in: ['active', 'pending'] } });

                // Reuse logic: filter by slot not strictly necessary for migration, 
                // but if we had slot info we would. 
                // For migration, just pick best available load-balanced tutor.

                if (tutors.length === 0) {
                    console.log(`    No active tutors found for ${subject}`);
                    continue;
                }

                const tutorsWithLoad = await Promise.all(tutors.map(async (t) => {
                    const count = await Class.countDocuments({ tutor: t._id, status: { $ne: 'completed' } });
                    return { ...t.toObject(), load: count };
                }));

                tutorsWithLoad.sort((a, b) => {
                    if (a.load !== b.load) return a.load - b.load;
                    return (b.experienceYears || 0) - (a.experienceYears || 0);
                });

                const bestTutorData = tutorsWithLoad[0];
                const tutor = await Tutor.findById(bestTutorData._id).populate('user');

                if (tutor) {
                    // Create Class
                    const avail = Array.isArray(tutor.availability) ? tutor.availability : [];
                    // Default schedule if unknown
                    const sched = avail[0] || { day: 'Monday', startTime: '18:00', endTime: '19:00' };

                    const cls = await Class.create({
                        title: `${subject} - ${student.user}`,
                        subject: subject,
                        tutor: tutor._id,
                        students: [student._id],
                        schedule: { day: sched.day, startTime: sched.startTime, endTime: sched.endTime },
                        status: 'scheduled',
                        sessionLink: `https://meet.google.com/kk-class-${Date.now()}-${subject.replace(/\s+/g, '-')}`
                    });

                    console.log(`    -> Created Class: ${cls.title} with Tutor ${tutor.user.name}`);
                    fixedCount++;
                }
            }
        }

        console.log(`--- Finished. Fixed ${fixedCount} assignments. ---`);

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

fixAssignments();
