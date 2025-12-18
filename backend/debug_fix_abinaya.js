const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Tutor = require('./models/Tutor');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Get Abinaya
        const u = await User.findOne({ email: 'abinaya123@gmail.com' });
        const student = await Student.findOne({ user: u._id });
        console.log(`Student: ${u.name}, Current Tutor: ${student.tutor}`);

        // 2. Get Viknesh
        const vUser = await User.findOne({ email: 'viknesh123@gmail.com' });
        const tutor = await Tutor.findOne({ user: vUser._id });
        console.log(`Tutor: ${vUser.name}, ID: ${tutor._id}`);

        // 3. Update Mapping
        student.tutor = tutor._id;
        await student.save();
        console.log("Updated Abinaya's tutor to Viknesh.");

        // Verify
        const s2 = await Student.findOne({ user: u._id });
        console.log(`New Tutor: ${s2.tutor}`);

    } catch (e) { console.error(e); }
    process.exit();
};
run();
