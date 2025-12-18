const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tutor = require('./models/Tutor');
const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');

dotenv.config({ path: './.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    try {
        // 1. Find Abinaya again to get ID
        const u = await User.findOne({ email: 'abinaya123@gmail.com' });
        if (!u) {
            console.log("Abinaya not found");
            return;
        }
        const s = await Student.findOne({ user: u._id });
        if (!s) {
            console.log("Abinaya student doc not found");
            return;
        }
        console.log(`Abinaya Student ID: ${s._id}`);

        // 2. Find Classes containing Abinaya
        const classes = await Class.find({ students: s._id }).populate('tutor');
        console.log(`\nClasses containing Abinaya (${classes.length}):`);
        for (const c of classes) {
            console.log(`- Class: "${c.title}" (Subject: ${c.subject})`);
            console.log(`  Tutor ID: ${c.tutor?._id}`);
            if (c.tutor) {
                const tu = await User.findById(c.tutor.user);
                console.log(`  Tutor Name: ${tu?.name} (${tu?.email})`);
            }
        }

        // 3. Find Viknesh by email
        const vikUser = await User.findOne({ email: 'viknesh123@gmail.com' });
        if (vikUser) {
            console.log(`\nViknesh User found: ${vikUser.name} (${vikUser.email}) ID: ${vikUser._id}`);
            const vikTutor = await Tutor.findOne({ user: vikUser._id });
            console.log(`Viknesh Tutor ID: ${vikTutor?._id}`);

            // Re-check classes for this specific tutor ID
            if (vikTutor) {
                const vClasses = await Class.find({ tutor: vikTutor._id });
                console.log(`\nVerified Classes for Viknesh (${vClasses.length}):`);
                vClasses.forEach(c => {
                    console.log(`- ${c.title} (Students: ${c.students.length})`);
                });
            }
        } else {
            console.log("\nViknesh user not found by email.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

runDebug();
