const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tutor = require('./models/Tutor');
const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    try {
        const vikTutorId = "693e453e06b6cd0b64583a55"; // From previous output
        console.log(`Scanning for Tutor ID: ${vikTutorId}`);

        // 1. Check Students with this tutor
        const students = await Student.find({ tutor: vikTutorId }).populate('user');
        console.log(`\nStudents with tutor=${vikTutorId}: ${students.length}`);
        students.forEach(s => console.log(`- ${s.user?.name} (${s.user?.email})`));

        // 2. Check Classes with this tutor
        const classes = await Class.find({ tutor: vikTutorId });
        console.log(`\nClasses with tutor=${vikTutorId}: ${classes.length}`);
        classes.forEach(c => {
            console.log(`- [${c._id}] ${c.title} (Students: ${c.students.length})`);
            console.log(`  Student IDs: ${c.students}`);
        });

        // 3. Check specific student from screenshot
        const sEmail = "snanthini2802@gmail.com";
        const sUser = await User.findOne({ email: sEmail });
        if (sUser) {
            const sDoc = await Student.findOne({ user: sUser._id });
            console.log(`\nStudent: ${sEmail}`);
            console.log(`  Tutor Field: ${sDoc?.tutor}`);
            // Check if this student is in any class linked to Viknesh
            const types = await Class.find({ students: sDoc?._id, tutor: vikTutorId });
            console.log(`  Enrolled in Viknesh Classes: ${types.length}`);
        } else {
            console.log(`\nStudent ${sEmail} not found`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

runDebug();
