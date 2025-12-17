const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkData = async () => {
    await connectDB();

    try {
        const User = require("./models/User");
        const Student = require("./models/Student");

        const user = await User.findOne({ email: "deepika123@gmail.com" });
        if (!user) {
            console.log("User 'deepika123@gmail.com' not found!");
            return;
        }
        console.log("User found:", user.name, user._id);

        let student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log("Student record NOT found. Creating one...");
            student = await Student.create({
                user: user._id,
                grade: "12th Grade",
                subjects: ["Mathematics"], // Ensure subject is set for Quizzes
                rollNumber: "STD" + Math.floor(Math.random() * 1000)
            });
            console.log("Created Student record:", student._id);
        } else {
            console.log("Student record found.");
            console.log("Current subjects:", student.subjects);

            // Fix if no subjects or grade missing
            let updated = false;
            if (!student.subjects || student.subjects.length === 0) {
                console.log("Adding 'Mathematics' to subjects...");
                student.subjects = ["Mathematics"];
                updated = true;
            }
            if (!student.grade) {
                student.grade = "12th Grade";
                updated = true;
            }

            if (updated) {
                await student.save();
                console.log("Updated student record.");
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

checkData();
