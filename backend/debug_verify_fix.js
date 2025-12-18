const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email: 'abinaya123@gmail.com' });
        const student = await Student.findOne({ user: user._id });
        console.log(`Student: ${user.name}, Tutor: ${student.tutor}`);

        // THE NEW QUERY LOGIC
        const query = {
            $or: [{ students: student._id }],
        };
        if (student.tutor) {
            query.$or.push({ tutor: student.tutor });
        }

        let classes = [];
        try {
            classes = await Class.find(query).populate('tutor');
        } catch (err) {
            console.log("\nQUERY FAILED:", err.message);
            console.log("Query was:", JSON.stringify(query, null, 2));
            return;
        }
        console.log(`\nVisible Classes (${classes.length}):`);
        classes.forEach(c => {
            console.log(`- ${c.title} (By: ${c.tutor?.user})`);
        });

    } catch (e) { console.error(e); }
    process.exit();
};
run();
