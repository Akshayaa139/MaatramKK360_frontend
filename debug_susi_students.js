const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Tutor = require('./backend/models/Tutor');
const Class = require('./backend/models/Class');
const Student = require('./backend/models/Student');
const Application = require('./backend/models/Application');
require('dotenv').config({ path: './backend/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    console.log("--- Debugging Susi's Dashboard ---");

    // 1. Find Susi
    const susiUser = await User.findOne({ email: { $regex: 'susi', $options: 'i' } });
    if (!susiUser) {
        console.log("Susi User not found");
        return;
    }
    console.log(`Susi User: ${susiUser.name} (${susiUser.email}) ID: ${susiUser._id}`);

    const susiTutor = await Tutor.findOne({ user: susiUser._id });
    if (!susiTutor) {
        console.log("Susi Tutor Profile not found");
        return;
    }
    console.log(`Susi Tutor ID: ${susiTutor._id}`);

    // 2. Find Suba
    const subaUser = await User.findOne({ email: { $regex: 'suba', $options: 'i' } }); // Search flexible
    let subaStudent = null;
    if (subaUser) {
        console.log(`Suba User Found: ${subaUser.name} (${subaUser.email}) ID: ${subaUser._id}`);
        subaStudent = await Student.findOne({ user: subaUser._id });
        if (subaStudent) {
            console.log(`Suba Student Profile Found ID: ${subaStudent._id}`);
        } else {
            console.log("Suba has User but NO Student profile");
            // Check if Application exists
            const app = await Application.findOne({ 'personalInfo.email': subaUser.email });
            if (app) console.log("Suba Application Found:", app._id, "Status:", app.status);
        }
    } else {
        console.log("Suba User not found by email search. Checking Applications...");
        // Check Application by name "suba" or email
        const app = await Application.findOne({ $or: [{ studentName: /suba/i }, { 'personalInfo.fullName': /suba/i }] });
        if (app) {
            console.log(`Found Application for Suba: ${app.studentName} (${app.personalInfo?.email}) Status: ${app.status}`);
            if (app.tutorAssignment && app.tutorAssignment.tutor) {
                console.log("Assigned to Tutor:", app.tutorAssignment.tutor);
            }
        } else {
            console.log("No Application found for Suba either.");
        }
    }

    // 3. Check Classes for Susi
    const classes = await Class.find({ tutor: susiTutor._id });
    console.log(`\nFound ${classes.length} classes for Susi:`);

    for (const cls of classes) {
        console.log(`- Class: ${cls.title} (${cls.subject}) ID: ${cls._id}`);
        console.log(`  Enrolled Student IDs: ${cls.students.length}`);

        // Check for Suba in this class
        if (subaStudent && cls.students.includes(subaStudent._id)) {
            console.log("  >>> SUBA IS IN THIS CLASS <<<");
        }

        // Scan for invalid IDs
        for (const sid of cls.students) {
            const s = await Student.findById(sid);
            if (!s) {
                console.log(`  [WARNING] Missing Student Record for ID: ${sid} (This causes dashboard crash/invisibility)`);
            }
        }
    }

    process.exit();
};

run();
