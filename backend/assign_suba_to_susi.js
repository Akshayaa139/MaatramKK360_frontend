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

const assign = async () => {
    await connectDB();
    console.log("Assigning Suba to Susi...");

    // 1. Find Suba App
    const app = await Application.findOne({ applicationNumber: 'KK2025-F90F98' });
    if (!app) { console.log("Suba App Not Found"); process.exit(); }

    // 2. Find Susi Tutor
    const susiUser = await User.findOne({ email: { $regex: 'susi', $options: 'i' } });
    if (!susiUser) { console.log("Susi User Not Found"); process.exit(); }
    const susiTutor = await Tutor.findOne({ user: susiUser._id });
    if (!susiTutor) { console.log("Susi Tutor Not Found"); process.exit(); }

    // 3. Find Suba Student Profile
    // 3. Find Suba Student Profile
    const subaUser = await User.findOne({ $or: [{ email: app.email }, { 'personalInfo.email': app.personalInfo?.email }] });
    let subaStudent = null;

    if (!subaUser) {
        console.log("Suba User Not Found. Creating User...");
        const newUser = await User.create({
            name: app.studentName || 'Suba',
            email: app.email || app.personalInfo?.email,
            password: 'Welcome@123', // Default
            role: 'student',
            phone: app.phone || app.personalInfo?.phone || '0000000000'
        });
        console.log(`Created User: ${newUser._id}`);

        console.log("Creating Suba Student Profile...");
        subaStudent = await Student.create({
            user: newUser._id,
            grade: app.educationalInfo?.currentClass || 'Unknown',
            subjects: app.educationalInfo?.subjects?.map(s => s.name || s) || []
        });
    } else {
        subaStudent = await Student.findOne({ user: subaUser._id });
        if (!subaStudent) {
            console.log("User exists but Student Profile missing. Creating...");
            subaStudent = await Student.create({
                user: subaUser._id,
                grade: app.educationalInfo?.currentClass || 'Unknown',
                subjects: app.educationalInfo?.subjects?.map(s => s.name || s) || []
            });
        }
    }

    // 4. Find Class
    const subject = "Mathematics"; // From screenshot
    let cls = await Class.findOne({
        tutor: susiTutor._id,
        subject: { $regex: new RegExp(subject, 'i') }
    });

    if (!cls) {
        console.log("Creating Class for Susi...");
        cls = await Class.create({
            title: `${subject} - ${susiUser.name}`,
            subject: subject,
            tutor: susiTutor._id,
            students: [],
            schedule: { day: 'Monday', startTime: '18:00', endTime: '19:00' },
            status: 'scheduled',
            sessionLink: `https://meet.google.com/kk-class-${susiTutor._id}-math`
        });
    }

    // 5. Update All
    // Enroll in Class
    if (!cls.students.map(String).includes(String(subaStudent._id))) {
        cls.students.push(subaStudent._id);
        await cls.save();
        console.log("Enrolled Suba in Class.");
    } else {
        console.log("Suba already enrolled in class.");
    }

    // Update Application
    app.status = 'selected';
    app.tutorAssignment = {
        tutor: susiTutor._id,
        meetingLink: cls.sessionLink,
        schedule: cls.schedule
    };
    await app.save();
    console.log("Updated Application Tutor Assignment.");

    // Update Student Profile
    subaStudent.tutor = susiTutor._id;
    await subaStudent.save();
    console.log("Updated Student Profile Tutor.");

    // Update Tutor Profile
    await Tutor.updateOne({ _id: susiTutor._id }, { $addToSet: { students: subaStudent._id } });
    console.log("Updated Tutor Student List.");

    console.log("Assignment Complete!");
    process.exit();
};

assign();
