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

const debugApp = async () => {
    await connectDB();
    console.log("Debugging Application KK2025-F90F98...");

    const app = await Application.findOne({ applicationNumber: 'KK2025-F90F98' });
    if (!app) {
        console.log("Application NOT FOUND!");
        process.exit();
    }

    console.log(`Application Found: ${app._id}`);
    console.log(`Student Name: ${app.studentName}`);
    console.log(`Email: ${app.email || app.personalInfo?.email}`);
    console.log(`Status: ${app.status}`);
    console.log(`Tutor Assignment:`, app.tutorAssignment);

    if (app.tutorAssignment && app.tutorAssignment.tutor) {
        const tutor = await Tutor.findById(app.tutorAssignment.tutor).populate('user');
        console.log(`Assigned Tutor: ${tutor ? tutor.user?.name : 'NOT FOUND'}`);

        // Check Classes for this tutor
        const classes = await Class.find({ tutor: app.tutorAssignment.tutor });
        console.log(`Classes for Tutor (${classes.length}):`);

        // Find student user/profile
        const email = app.email || app.personalInfo?.email;
        const user = await User.findOne({ $or: [{ email }, { 'personalInfo.email': email }] });
        let student = null;
        if (user) {
            console.log(`User Found: ${user.name} (${user._id})`);
            student = await Student.findOne({ user: user._id });
            console.log(`Student Profile: ${student ? student._id : 'NOT FOUND'}`);
        } else {
            console.log(`User NOT FOUND for email ${email}`);
        }

        if (student) {
            for (const cls of classes) {
                const isEnrolled = cls.students.map(String).includes(String(student._id));
                console.log(`- Class ${cls.title}: Enrolled? ${isEnrolled}`);
            }
        }
    } else {
        console.log("No Tutor Assigned in Application data.");
    }

    process.exit();
};

debugApp();
