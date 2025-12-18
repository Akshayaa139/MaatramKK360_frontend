const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'abi123@gmail.com';
        const user = await User.findOne({ email });
        if (user) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('123456', salt);
            await User.updateOne({ _id: user._id }, { password: hash });
            console.log(`Reset password for ${email}`);
        } else {
            console.log("User not found");
        }
    } catch (e) { console.error(e); }
    process.exit();
};
run();
