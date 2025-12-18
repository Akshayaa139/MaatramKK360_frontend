const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
};

const bcrypt = require('bcryptjs');

const resetPassword = async (namePattern, newPassword) => {
    const user = await User.findOne({ name: { $regex: namePattern, $options: 'i' } });
    if (!user) {
        console.log(`User matching '${namePattern}' not found.`);
        return;
    }

    // Hash manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Bypass schema hooks using updateOne
    await User.updateOne({ _id: user._id }, { password: hashedPassword });
    console.log(`Password updated (direct DB write) for user: ${user.name} (${user.email})`);
};

const run = async () => {
    await connectDB();

    const targets = ['Guru', 'Abinaya', 'Suba'];
    const newPass = '123456';

    console.log(`Resetting passwords to '${newPass}'...`);

    for (const target of targets) {
        await resetPassword(target, newPass);
    }

    process.exit();
};

run();
