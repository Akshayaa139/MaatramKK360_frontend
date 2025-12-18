const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const resetFor = async (email) => {
    const newPass = '123456';
    const user = await User.findOne({ email: new RegExp(email, 'i') });
    if (!user) { console.log(`User ${email} not found`); return; }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPass, salt);
    await User.updateOne({ _id: user._id }, { password: hash });
    console.log(`Reset password for ${user.name} (${user.email})`);
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await resetFor('guru123@gmail.com');
        // Abinaya already done, but redo is fine
        await resetFor('abinaya123@gmail.com');
        await resetFor('suba123@gmail.com');
    } catch (e) {
        console.error(e);
    }
    process.exit();
};
run();
