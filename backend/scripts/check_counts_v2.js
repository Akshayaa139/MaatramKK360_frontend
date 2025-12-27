const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkCounts = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const Panel = mongoose.model('Panel', new mongoose.Schema({}));
        const Timeslot = mongoose.model('Timeslot', new mongoose.Schema({}));
        const Tutor = mongoose.model('Tutor', new mongoose.Schema({}));
        const Application = mongoose.model('Application', new mongoose.Schema({}));
        const User = mongoose.model('User', new mongoose.Schema({}));

        const panelCount = await Panel.countDocuments();
        const timeslotCount = await Timeslot.countDocuments();
        const tutorCount = await Tutor.countDocuments();
        const appCount = await Application.countDocuments({ status: 'selected' });
        const userCount = await User.countDocuments();

        console.log(`Panel count: ${panelCount}`);
        console.log(`Timeslot count: ${timeslotCount}`);
        console.log(`Tutor count: ${tutorCount}`);
        console.log(`Selected Application count: ${appCount}`);
        console.log(`User count: ${userCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCounts();
