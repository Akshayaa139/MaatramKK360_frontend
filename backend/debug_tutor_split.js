const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');

const runDebug = async () => {
    await connectDB();

    try {
        console.log('--- Listing Recent Applications ---');
        const apps = await require('./models/Application').find().sort({ createdAt: -1 }).limit(5);
        apps.forEach(a => {
            console.log(`ID: ${a._id}, AppNum: ${a.applicationNumber}, Name: ${a.name}, FullName: ${a.personalInfo?.fullName}, Email: ${a.email} || ${a.personalInfo?.email}`);
        });

        if (apps.length === 0) console.log('No applications found.');

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

runDebug();
