const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const findMohana = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String
        }));

        const user = await User.findOne({ email: /mohana123/i });
        console.log('User Data:', JSON.stringify(user, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findMohana();
