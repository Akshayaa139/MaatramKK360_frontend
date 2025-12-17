const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.join(__dirname, ".env") });

const Tutor = require("./models/Tutor");
const FlashcardSet = require("./models/FlashcardSet");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("Connection Error:", err.message);
        process.exit(1);
    }
};

const MATH_QUESTIONS = [
    {
        question: "If alpha and beta are the zeros of the quadratic polynomial f(x) = x^2 - x - 4, find the value of 1/alpha + 1/beta - alpha*beta.",
        choices: ["15/4", "-15/4", "4", "15"],
        correctIndex: 0
    },
    {
        question: "The distance between the points A(0, 6) and B(0, -2) is:",
        choices: ["6", "8", "4", "2"],
        correctIndex: 1
    },
    {
        question: "If tan A = 4/3, then the value of cos A is:",
        choices: ["3/5", "4/5", "5/3", "5/4"],
        correctIndex: 0
    },
    {
        question: "The nth term of an AP is 7 - 4n. The common difference is:",
        choices: ["-4", "4", "7", "-7"],
        correctIndex: 0
    },
    {
        question: "In a group of 400 people, 250 speak Hindi and 200 speak English. How many speak both?",
        choices: ["50", "40", "30", "20"],
        correctIndex: 0
    },
    {
        question: "The value of sin 75° is:",
        choices: ["(√6 - √2)/4", "(√6 + √2)/4", "(√3 + 1)/2√2", "(√3 - 1)/2√2"],
        correctIndex: 1
    },
    {
        question: "What is the derivative of sin(x) with respect to x?",
        choices: ["cos(x)", "-cos(x)", "tan(x)", "sec^2(x)"],
        correctIndex: 0
    },
    {
        question: "If A = {1, 2, 3}, the number of subsets of A is:",
        choices: ["3", "6", "8", "9"],
        correctIndex: 2
    },
    {
        question: "If A is a square matrix such that A^2 = A, then (I + A)^3 - 7A is equal to:",
        choices: ["A", "I - A", "I", "3A"],
        correctIndex: 2
    },
    {
        question: "The order and degree of the differential equation d2y/dx2 + (dy/dx)^3 + y = 0 are:",
        choices: ["Order: 1, Degree: 1", "Order: 2, Degree: 1", "Order: 2, Degree: 3", "Order: 1, Degree: 2"],
        correctIndex: 1
    },
    {
        question: "The integration of e^x(1 + x) / cos^2(e^x * x) with respect to x is:",
        choices: ["tan(xe^x) + C", "-cot(xe^x) + C", "tan(e^x) + C", "cot(e^x) + C"],
        correctIndex: 0
    },
    {
        question: "The direction cosines of the vector 3i - 4j + 12k are:",
        choices: ["3/13, -4/13, 12/13", "3, -4, 12", "3/√13, -4/√13, 12/√13", "None of these"],
        correctIndex: 0
    }
];

const PHYSICS_QUESTIONS = [
    {
        question: "Which of the following is a unit of energy?",
        choices: ["Newton", "Watt", "Joule", "Pascal"],
        correctIndex: 2
    },
    {
        question: "The SI unit of electric charge is:",
        choices: ["Ampere", "Coulomb", "Ohm", "Volt"],
        correctIndex: 1
    },
    {
        question: "Newton's First Law of Motion is also known as the Law of:",
        choices: ["Friction", "Momentum", "Inertia", "Gravity"],
        correctIndex: 2
    }
];

const seed = async () => {
    await connectDB();

    // 1. Find a Tutor
    const tutor = await Tutor.findOne();
    if (!tutor) {
        console.error("No tutors found.");
        process.exit(1);
    }

    try {
        // 2. Clear existing sets to avoid duplicates
        await FlashcardSet.deleteMany({ subject: { $in: ["Mathematics", "Physics"] } });
        console.log("Cleared old Math/Physics sets.");

        // 3. Create Mathematics Set
        if (MATH_QUESTIONS.length > 0) {
            await FlashcardSet.create({
                tutor: tutor._id,
                title: "Essential Mathematics (Grade 10-12)",
                subject: "Mathematics",
                cards: MATH_QUESTIONS
            });
            console.log("Math Set Created (12 questions)");
        }

        // 4. Create Physics Set
        if (PHYSICS_QUESTIONS.length > 0) {
            await FlashcardSet.create({
                tutor: tutor._id,
                title: "Physics Fundamentals",
                subject: "Physics",
                cards: PHYSICS_QUESTIONS
            });
            console.log("Physics Set Created (3 questions)");
        }

    } catch (e) {
        console.error("Error creating flashcards:", e);
    } finally {
        mongoose.disconnect();
    }
};

seed();
