const mongoose = require('mongoose');
const User = require('./models/User');
const Tutor = require('./models/Tutor');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Application = require('./models/Application');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_discrepancy_output.txt', msg + '\n');
}

const run = async () => {
    try {
        fs.writeFileSync('debug_discrepancy_output.txt', 'Starting discrepancy check...\n');
        await mongoose.connect(process.env.MONGODB_URI);

        const tutorEmail = "susi123@gmail.com";
        const susiUser = await User.findOne({ email: tutorEmail });
        if (!susiUser) {
            log("Susi user not found");
            return;
        }
        const susiTutor = await Tutor.findOne({ user: susiUser._id });
        if (!susiTutor) {
            log("Susi tutor profile not found");
            return;
        }
        log(`Tutor Susi: ${susiTutor._id}`);

        const studentsToCheck = ["Guru", "Abinaya", "nanthu", "dharshini"];
        for (const name of studentsToCheck) {
            log(`\nChecking student/applicant: ${name}`);
            // Find Application using regex for name
            const app = await Application.findOne({
                $or: [
                    { "personalInfo.fullName": { $regex: name, $options: 'i' } },
                    { "name": { $regex: name, $options: 'i' } },
                    { "studentName": { $regex: name, $options: 'i' } }
                ]
            });

            if (app) {
                log(`  Application found: ${app._id} (${app.applicationNumber})`);
                log(`  Status: ${app.status}`);
                log(`  Tutor Assignment: ${JSON.stringify(app.tutorAssignment)}`);
                if (app.tutorAssignment?.tutor && app.tutorAssignment.tutor.toString() === susiTutor._id.toString()) {
                    log("  -> Application says assigned to Susi");
                } else if (app.tutorAssignment?.tutor) {
                    log(`  -> Assigned to DIFFERENT tutor: ${app.tutorAssignment.tutor}`);
                } else {
                    log("  -> No tutor assigned in Application");
                }

                // Check if Student record exists
                const email = app.personalInfo?.email || app.email;
                let user = await User.findOne({ email });
                if (user) {
                    log(`  User record found: ${user._id}`);
                    const student = await Student.findOne({ user: user._id });
                    if (student) {
                        log(`  Student record found: ${student._id}`);
                        // Check classes for this student
                        const classes = await Class.find({ students: student._id });
                        log(`  Classes count: ${classes.length}`);
                        classes.forEach(c => {
                            log(`    Class: ${c.title} (Tutor: ${c.tutor})`);
                        });
                    } else {
                        log("  Student record NOT found");
                    }
                } else {
                    log(`  User record NOT found for email ${email}`);
                }

            } else {
                log("  Application NOT found");
            }
        }

        // Check classes owned by Susi
        const susiClasses = await Class.find({ tutor: susiTutor._id });
        log(`\nTotal classes for Susi: ${susiClasses.length}`);

    } catch (e) {
        log(`ERROR: ${e}`);
    } finally {
        mongoose.disconnect();
    }
};

run();
