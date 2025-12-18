const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Class = require('./models/Class');

// Load env
dotenv.config({ path: './.env', override: true });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
};

const runCleanup = async () => {
    await connectDB();

    // Regex to match " - [24 hex chars]" at the end
    const regex = / - [0-9a-f]{24}$/i;

    try {
        const classes = await Class.find({ title: { $regex: regex } });
        console.log(`Found ${classes.length} classes with meaningless titles.`);

        if (classes.length > 0) {
            const result = await Class.deleteMany({ title: { $regex: regex } });
            console.log(`Deleted ${result.deletedCount} classes.`);
        } else {
            console.log("No matching classes found to delete.");
        }
    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        mongoose.connection.close();
    }
};

runCleanup();
