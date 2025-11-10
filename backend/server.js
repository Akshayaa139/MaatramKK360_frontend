const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'backend.log'), { flags: 'a' });

// Overwrite console.log and console.error to also write to the file
const log = console.log;
const error = console.error;
console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    accessLogStream.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
    log.apply(console, args);
};
console.error = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    accessLogStream.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
    error.apply(console, args);
};


// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Route files
const testRoutes = require('./routes/testRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/tests', testRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/televerification', require('./routes/televerificationRoutes'));
app.use('/api/panel', require('./routes/panelRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  res.send('KK360 API is running...');
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
