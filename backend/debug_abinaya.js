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
        // Find user Abinaya
        const u = await User.findOne({ email: 'abinaya123@gmail.com' });
        if (!u) {
            console.log("Abinaya user not found");
        } else {
            console.log(`Abinaya User ID: ${u._id}`);
            const s = await Student.findOne({ user: u._id });
            if (s) {
                console.log(`Student Doc ID: ${s._id}`);
                console.log(`Assigned Tutor ID: ${s.tutor}`);

                if (s.tutor) {
                    const t = await Tutor.findById(s.tutor).populate('user');
                    if (t) {
                        console.log(`Tutor Details: ${t.user?.name} (User ID: ${t.user?._id})`);
                        console.log(`Tutor Doc ID: ${t._id}`);
                    } else {
                        console.log("Tutor doc not found for ID:", s.tutor);
                        // Check if it's a User ID by mistake
                        const tu = await User.findById(s.tutor);
                        if (tu) console.log(`Wait! The tutor field points to a USER: ${tu.name}`);
                    }
                } else {
                    console.log("No tutor assigned in Student doc");
                }
            } else {
                console.log("Student doc not found");
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

runDebug();
