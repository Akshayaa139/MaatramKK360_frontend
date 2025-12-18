const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Tutor = require('./backend/models/Tutor');
const Class = require('./backend/models/Class');
const Student = require('./backend/models/Student');
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

    console.log("--- Debugging Viknesh's Dashboard ---");

    // 1. Find Viknesh
    const user = await User.findOne({ email: { $regex: 'viknesh', $options: 'i' } });
    if (!user) {
        console.log("Viknesh User not found");
        return;
    }
    console.log(`Viknesh User: ${user.name} (${user.email}) ID: ${user._id}`);

    const tutor = await Tutor.findOne({ user: user._id });
    if (!tutor) {
        console.log("Viknesh Tutor Profile not found");
        return;
    }
    console.log(`Viknesh Tutor ID: ${tutor._id}`);
    console.log(`Viknesh Subjects: ${JSON.stringify(tutor.subjects)}`);

    // Fetch Students as the current route does
    // 1. Get students explicitly assigned to this tutor
    const assignedStudents = await Student.find({ tutor: tutor._id }).populate("user", "name email");
    console.log(`Explicitly Assigned Students: ${assignedStudents.length}`);

    // 2. Get students in tutor's classes
    const classes = await Class.find({ tutor: tutor._id }).populate({
        path: "students",
        populate: { path: "user", select: "name email" },
    });
    console.log(`Classes Taught: ${classes.length}`);

    const allStudents = [];
    const seen = new Set();
    const add = (s, source) => {
        if (!s) return;
        const sid = String(s._id);
        if (!seen.has(sid)) {
            seen.add(sid);
            allStudents.push({ ...s.toObject(), _source: source });
        }
    };

    for (const s of assignedStudents) add(s, 'assigned');
    for (const c of classes) {
        for (const s of c.students || []) add(s, `class: ${c.title}`);
    }

    console.log(`\nTotal Visible Students (Current Logic): ${allStudents.length}`);

    // Simulate Filtering
    console.log("\n--- Simulating Filter ---");
    const tutorSubjects = (tutor.subjects || []).map(s => s.toLowerCase());

    let keptCount = 0;
    let filteredCount = 0;

    for (const s of allStudents) {
        const studentSubjects = (s.subjects || []).map(sub => sub.toLowerCase());
        const hasOverlap = studentSubjects.some(sub => tutorSubjects.includes(sub));

        if (hasOverlap) {
            console.log(`[KEEP] ${s.user.name} (${s.user.email}) - Subjects: ${s.subjects}`);
            keptCount++;
        } else {
            console.log(`[FILTER OUT] ${s.user.name} (${s.user.email}) - Subjects: ${s.subjects} (Source: ${s._source})`);
            filteredCount++;
        }
    }

    console.log(`\nResults: Kept ${keptCount}, Filtered Out ${filteredCount}`);

    process.exit();
};

run();
