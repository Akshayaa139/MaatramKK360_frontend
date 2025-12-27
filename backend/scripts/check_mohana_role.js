const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkMohanaRole = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
        const user = await User.findOne({ email: /mohana123/i });
        if (user) {
            console.log(`User Found: ${user.email}, Role: ${user.role}`);
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
checkMohanaRole();
