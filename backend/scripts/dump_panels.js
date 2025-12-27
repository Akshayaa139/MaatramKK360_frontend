const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dumpPanels = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const panels = await mongoose.connection.db.collection('panels').find({}).toArray();
        console.log('RAW Panels:', JSON.stringify(panels, null, 2));

        const timeslots = await mongoose.connection.db.collection('timeslots').find({}).toArray();
        console.log('RAW Timeslots:', JSON.stringify(timeslots, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dumpPanels();
