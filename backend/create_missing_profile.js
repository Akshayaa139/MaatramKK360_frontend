const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Tutor = require('./models/Tutor');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const userId = '690f02bc28f7404cc8d8d428';
        const user = await User.findById(userId);
        if (!user) { console.log("User not found"); return; }

        console.log(`Creating profile for: ${user.name}`);

        // Find a tutor to map to (Viknesh)
        const vUser = await User.findOne({ email: 'viknesh123@gmail.com' });
        const tutor = await Tutor.findOne({ user: vUser._id });

        const student = await Student.create({
            user: user._id,
            grade: 'Grade 10',
            subjects: ['Mathematics', 'Physics'], // Default subjects
            tutor: tutor._id,
            availability: [],
            attendance: [],
            performance: []
        });

        console.log(`Created Student Profile: ${student._id} mapped to ${vUser.name}`);

    } catch (e) { console.error(e); }
    process.exit();
};
run();
