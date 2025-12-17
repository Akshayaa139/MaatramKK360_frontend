const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Application = require('./models/Application');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_output.txt', msg + '\n');
}

const run = async () => {
    try {
        fs.writeFileSync('debug_output.txt', 'Starting debug investigation...\n');
        await mongoose.connect(process.env.MONGODB_URI);

        // Check Susi
        const email = "susi123@gmail.com";
        const user = await User.findOne({ email });
        if (user) {
            const tutor = await Tutor.findOne({ user: user._id });
            if (tutor) {
                log(`Susi Tutor ID: ${tutor._id}`);
                log(`Availability: ${JSON.stringify(tutor.availability)}`);
                log(`Experience: ${tutor.experienceYears}`);
                log(`Subjects: ${tutor.subjects}`);
            }
        }

        // Check recent assignments
        log("\nChecking recent 'selected' applications:");
        const apps = await Application.find({ status: 'selected' }).limit(5).sort({ updatedAt: -1 });
        for (const app of apps) {
            log(`App ${app.applicationNumber} (${app.personalInfo?.fullName}):`);
            log(`  - Assigned Tutor ID: ${app.tutorAssignment?.tutor}`);
            if (app.tutorAssignment?.tutor) {
                const t = await Tutor.findById(app.tutorAssignment.tutor).populate('user');
                log(`  - Tutor Name: ${t?.user?.name} (${t?.user?.email})`);
            }
        }

    } catch (e) {
        log(`ERROR: ${e}`);
    } finally {
        mongoose.disconnect();
    }
};

run();
