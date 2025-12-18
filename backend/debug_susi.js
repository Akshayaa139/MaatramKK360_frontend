const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Application = require('./models/Application');
require('dotenv').config();
console.log("Loaded Env Vars:", Object.keys(process.env).filter(k => k.includes('MONGO')));


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    console.log("--- Debugging Susi's Dashboard (from backend) ---");

    // 1. Find Susi
    const susiUser = await User.findOne({ email: { $regex: 'susi', $options: 'i' } });
    if (!susiUser) {
        console.log("Susi User not found");
        process.exit();
    }
    console.log(`Susi User: ${susiUser.name} (${susiUser.email}) ID: ${susiUser._id}`);

    const susiTutor = await Tutor.findOne({ user: susiUser._id });
    if (!susiTutor) {
        console.log("Susi Tutor Profile not found");
        process.exit();
    }
    console.log(`Susi Tutor ID: ${susiTutor._id}`);

    // 2. Find Suba
    // Search flexible
    const subaUsers = await User.find({
        $or: [
            { email: { $regex: 'suba', $options: 'i' } },
            { name: { $regex: 'suba', $options: 'i' } }
        ]
    });

    let subaStudentIds = [];

    if (subaUsers.length > 0) {
        console.log(`Found ${subaUsers.length} potential Suba users:`);
        for (const u of subaUsers) {
            console.log(`- User: ${u.name} (${u.email}) ID: ${u._id}`);
            const s = await Student.findOne({ user: u._id });
            if (s) {
                console.log(`  -> Student Profile Found ID: ${s._id}`);
                subaStudentIds.push(String(s._id));
            } else {
                console.log(`  -> No Student Profile`);
            }
        }
    } else {
        console.log("No User found with name/email 'suba'. Checking Applications...");
    }

    // Check Application just in case
    const apps = await Application.find({
        $or: [{ studentName: /suba/i }, { 'personalInfo.fullName': /suba/i }, { email: /suba/i }]
    });
    for (const app of apps) {
        console.log(`Application: ${app.studentName} (${app.email}) Status: ${app.status} AppID: ${app._id}`);
        if (app.tutorAssignment && app.tutorAssignment.tutor) {
            console.log(`  -> Assigned to Tutor: ${app.tutorAssignment.tutor}`);
            if (String(app.tutorAssignment.tutor) === String(susiTutor._id)) {
                console.log("  -> MATCH: Assigned to Susi");
            } else {
                console.log(`  -> MISMATCH: Assigned to ${app.tutorAssignment.tutor} (Susi is ${susiTutor._id})`);
            }
        }
    }

    // 3. Check Classes for Susi
    const classes = await Class.find({ tutor: susiTutor._id });
    console.log(`\nFound ${classes.length} classes for Susi (ID: ${susiTutor._id}):`);

    for (const cls of classes) {
        console.log(`- Class: ${cls.title} (${cls.subject}) ID: ${cls._id}`);
        console.log(`  Enrolled Student IDs: ${cls.students.length}`);

        let foundSubaInClass = false;
        // Check for Suba in this class
        for (const sid of subaStudentIds) {
            if (cls.students.map(String).includes(sid)) {
                console.log(`  >>> SUBA (${sid}) IS IN THIS CLASS <<<`);
                foundSubaInClass = true;
            }
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
