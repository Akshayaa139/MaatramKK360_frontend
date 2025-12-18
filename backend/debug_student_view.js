const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Assignment = require('./models/Assignment');
const StudyMaterial = require('./models/StudyMaterial');
require('dotenv').config({ path: './.env' });

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

    console.log("--- Debugging Student View ---");

    // 1. Find a Student who should have access
    // Try 'M.Searandhi' first as she has Physics
    let studentUser = await User.findOne({ name: { $regex: 'Searandhi', $options: 'i' } });
    if (!studentUser) {
        console.log("Searandhi not found, trying 'Abinaya'");
        studentUser = await User.findOne({ name: { $regex: 'Abinaya', $options: 'i' } });
    }

    if (!studentUser) {
        console.log("No test student found");
        return;
    }

    const student = await Student.findOne({ user: studentUser._id });
    if (!student) {
        console.log("Student profile not found");
        return;
    }

    console.log(`Student: ${studentUser.name} (${studentUser.email})`);
    console.log(`Student ID: ${student._id}`);
    console.log(`Assigned Tutor ID: ${student.tutor}`);
    console.log(`Subjects: ${student.subjects}`);

    // 2. Check Enrolled Classes (Current Logic)
    const enrolledClasses = await Class.find({ students: student._id }).populate('tutor');
    console.log(`\n[Current] Enrolled Classes: ${enrolledClasses.length}`);
    enrolledClasses.forEach(c => console.log(` - ${c.title} (${c.subject}) by ${c.tutor?.user}`));

    // 3. Check Mapped Tutor Classes (Proposed Logic)
    if (student.tutor) {
        const tutorClasses = await Class.find({
            tutor: student.tutor,
            // Optional: Filter by subject match?
            // subject: { $in: student.subjects } 
        });
        console.log(`\n[Proposed] Classes by Assigned Tutor (${student.tutor}): ${tutorClasses.length}`);
        tutorClasses.forEach(c => {
            const isEnrolled = c.students.includes(student._id);
            console.log(` - ${c.title} (${c.subject}) [Enrolled: ${isEnrolled}]`);
        });
    } else {
        console.log("\n[Proposed] No Assigned Tutor to check classes for.");
    }

    // 4. Check Assignments (Current Logic - strict enrollment)
    const classIds = enrolledClasses.map(c => c._id);
    const assignments = await Assignment.find({ class: { $in: classIds } });
    console.log(`\n[Current] Visible Assignments: ${assignments.length}`);

    // 5. Check Study Materials
    const materials = await StudyMaterial.find({}); // Fetch random sample or all
    console.log(`\nTotal Study Materials in DB: ${materials.length}`);
    // Check if any belong to the assigned tutor
    if (student.tutor) {
        const tutorMaterials = await StudyMaterial.find({ tutor: student.tutor });
        console.log(`Materials from Assigned Tutor: ${tutorMaterials.length}`);
    }

    process.exit();
};

run();
