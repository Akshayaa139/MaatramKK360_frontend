const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const problemUserId = '690f02bc28f7404cc8d8d428';
        const user = await User.findById(problemUserId);

        if (user) {
            console.log(`Problem User: ${user.name} (${user.email}) Role: ${user.role}`);

            const student = await Student.findOne({ user: user._id });
            if (!student) {
                console.log("CONFIRMED: No Student profile for this user.");
            } else {
                console.log("Strange, Student profile EXISTS:", student._id);
            }

            // Also check Guru and Suba just in case
            const guru = await User.findOne({ email: 'guru123@gmail.com' });
            const suba = await User.findOne({ email: 'suba123@gmail.com' });

            if (guru) {
                const s = await Student.findOne({ user: guru._id });
                console.log(`Guru Student Profile: ${s ? 'Exists' : 'MISSING'}`);
            }
            if (suba) {
                const s = await Student.findOne({ user: suba._id });
                console.log(`Suba Student Profile: ${s ? 'Exists' : 'MISSING'}`);
            }

        } else {
            console.log("User 690f... not found in DB. Maybe ID from logs was truncated or different DB?");
        }

    } catch (e) { console.error(e); }
    process.exit();
};
run();
