const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkBatches = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const Batch = mongoose.model('Batch', new mongoose.Schema({
            students: [mongoose.Schema.Types.ObjectId],
            panel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel' }
        }));

        const batchCount = await Batch.countDocuments();
        console.log(`Batch count: ${batchCount}`);

        const batches = await Batch.find().limit(5);
        console.log('Sample Batches:', JSON.stringify(batches, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBatches();
