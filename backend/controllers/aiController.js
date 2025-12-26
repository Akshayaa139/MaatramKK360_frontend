const asyncHandler = require("express-async-handler");
const { spawn } = require("child_process");
const path = require("path");
const Student = require("../models/Student");

// @desc    Chat with AI agent
// @route   POST /api/ai/chat
// @access  Private/Student
const chatWithAI = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
        res.status(400);
        throw new Error("Please provide a message");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500);
        throw new Error("Gemini API key is missing");
    }

    // Fetch student context for better "Agent" behavior
    const student = await Student.findOne({ user: req.user._id }).populate("user", "name");
    const studentContext = student ? {
        name: student.user?.name || "Student",
        grade: student.grade || "N/A",
        subjects: student.subjects || []
    } : { name: "Student", grade: "N/A", subjects: [] };

    const scriptPath = path.join(__dirname, "..", "scripts", "ai_agent.py");

    // Use spawn for safer execution and better argument handling
    // Passing context as a JSON string
    const python = spawn("python", [scriptPath, apiKey, message, JSON.stringify(studentContext)]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
        stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
        stderr += data.toString();
    });

    python.on("close", (code) => {
        if (code !== 0) {
            console.error(`AI Agent error (code ${code}): ${stderr}`);
            return res.status(500).json({ error: "Failed to communicate with AI agent" });
        }

        try {
            const result = JSON.parse(stdout.trim());
            res.json(result);
        } catch (parseError) {
            console.error(`AI Agent JSON parse error: ${stdout}`);
            res.status(500).json({ error: "Invalid response from AI agent" });
        }
    });
});

module.exports = {
    chatWithAI,
};
