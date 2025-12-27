const mongoose = require('mongoose');
require('dotenv').config();

const checkCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kk_hackfinal');
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
