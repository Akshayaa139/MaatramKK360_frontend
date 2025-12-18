const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email: 'abinaya123@gmail.com' });
        if (!user) { console.log("User not found"); return; }

        const student = await Student.findOne({ user: user._id });
        if (!student) { console.log("Student not found"); return; }

        console.log(`Student: ${user.name}`);
        console.log(`Subjects:`, student.subjects);
        console.log(`Assigned Tutor: ${student.tutor}`);

        if (student.tutor) {
            const classes = await Class.find({ tutor: student.tutor });
            console.log(`\nTutor's Classes:`);
            classes.forEach(c => {
                console.log(`- Title: "${c.title}" | Subject: "${c.subject}"`);
            });
        }

    } catch (e) { console.error(e); }
    process.exit();
};
run();
