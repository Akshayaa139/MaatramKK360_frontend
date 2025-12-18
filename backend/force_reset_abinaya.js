const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'abinaya123@gmail.com';
        const newPass = '123456';

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found!");
            return;
        }
        console.log(`Found user: ${user.name} (${user._id})`);

        // Manually hash
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);

        // Update direct
        await User.updateOne({ _id: user._id }, { password: hash });
        console.log("Password updated via updateOne.");

        // Verify immediately
        const u2 = await User.findOne({ email });
        const isMatch = await bcrypt.compare(newPass, u2.password);
        console.log(`Immediate bcrypt check: ${isMatch ? 'PASSED' : 'FAILED'}`);

    } catch (e) {
        console.error(e);
    }
    process.exit();
};
run();
