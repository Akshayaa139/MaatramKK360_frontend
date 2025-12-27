const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "backend.log"),
  { flags: "a" }
);

// Overwrite console.log and console.error to also write to the file
const log = console.log;
const error = console.error;
console.log = (...args) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");
  accessLogStream.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
  log.apply(console, args);
};
console.error = (...args) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");
  accessLogStream.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
  error.apply(console, args);
};

// Load env vars
dotenv.config({ override: true });

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const dev = process.env.NODE_ENV !== "production";
      if (dev) return callback(null, true);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options("/api/*splat", cors());

// Route files
const testRoutes = require("./routes/testRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/tests", testRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/televerification", require("./routes/televerificationRoutes"));
app.use("/api/panel", require("./routes/panelRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/tutor", require("./routes/tutorRoutes"));
app.use("/api/study-materials", require("./routes/studyMaterialRoutes"));
app.use("/api/messages", require("./routes/messageRoutes")); // Added
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/mentoring", require("./routes/mentoringRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/engagement", require("./routes/engagementRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
// Serve uploads statically for download/access
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/flashcards", require("./routes/flashcardRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "KK360 API is running..." });
});

// Root route welcome message
app.get("/", (req, res) => {
  res.send("Welcome to the KK360 API Server. Use /api/health to check status.");
});

// Start server only when run directly (so tests can import without starting an extra listener)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Error middleware for multer and general errors
app.use((err, req, res, next) => {
  try {
    if (!err) return next();
    // Multer file size or MulterError
    if (err.code === "LIMIT_FILE_SIZE" || err.name === "MulterError") {
      return res
        .status(400)
        .json({ message: err.message || "File upload error" });
    }
    console.error("Unhandled error middleware:", err);
    return res.status(500).json({ message: err.message || "Server Error" });
  } catch (e) {
    console.error("Error in error middleware", e);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Export app for tests
module.exports = app;
