const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const inspectPanel = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const Panel = mongoose.model('Panel', new mongoose.Schema({
            members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            timeslot: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeslot' },
            batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
            meetingLink: String
        }));

        // We need to define Timeslot and User models too for population if we want to see them
        const Timeslot = mongoose.model('Timeslot', new mongoose.Schema({
            panelist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            startTime: Date,
            endTime: Date,
            isFilled: Boolean
        }));

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String
        }));

        const panel = await Panel.findOne().populate('members').populate('timeslot').populate('batch');
        console.log('Panel Data:', JSON.stringify(panel, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectPanel();
