const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const u = await User.findOne({ email: 'abinaya123@gmail.com' });
        if (u) {
            console.log(`User: ${u.name}`);
            console.log(`ID: ${u._id}`);
            console.log(`Role: ${u.role}`);
        } else {
            console.log("User not found");
        }
    } catch (e) { console.error(e); }
    process.exit();
};
run();
