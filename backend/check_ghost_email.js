const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findById('690f02bc28f7404cc8d8d428');
        if (user) console.log(`ID: 690f... Email: ${user.email} Name: ${user.name}`);
    } catch (e) { console.error(e); }
    process.exit();
};
run();
