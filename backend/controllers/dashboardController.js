const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Class = require("../models/Class");
const Application = require("../models/Application");
const Televerification = require("../models/Televerification");
const Panel = require("../models/Panel");
const Batch = require("../models/Batch");
const InterviewEvaluation = require("../models/InterviewEvaluation");

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // User statistics
  const tutorCount = await User.countDocuments({ role: "tutor" });
  const studentCount = await User.countDocuments({ role: "student" });
  const volunteerCount = await User.countDocuments({ role: "volunteer" });

  // Application statistics
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({
    status: "pending",
  });
  // Fix: "approved" is not in enum, used "selected"
  const selectedApplications = await Application.countDocuments({
    status: "selected",
  });
  const approvedApplications = selectedApplications; // Alias for backward compatibility
  const rejectedApplications = await Application.countDocuments({
    status: "rejected",
  });
  // Tele-verification status from Application
  const teleVerificationApplications = await Application.countDocuments({
    status: "tele-verification",
  });

  // Tele-verification statistics (from Televerification model)
  const totalTeleverifications = await Televerification.countDocuments();
  const pendingTeleverifications = await Televerification.countDocuments({
    status: "Pending",
  });
  const completedTeleverifications = await Televerification.countDocuments({
    status: "Completed",
  });

  // Panel interview statistics
  const totalPanels = await Panel.countDocuments();
  const totalBatches = await Batch.countDocuments();
  const totalEvaluations = await InterviewEvaluation.countDocuments();

  // Class statistics
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingClassesCount = await Class.countDocuments({
    date: {
      $gte: now,
      $lt: twentyFourHoursFromNow,
    },
  });

  // Placeholder for engagement rate
  const engagementRate = "87%";

  res.json({
    // User stats
    tutorCount,
    studentCount,
    volunteerCount,
    // Application stats
    totalApplications,
    pendingApplications,
    selectedApplications,
    approvedApplications,
    rejectedApplications,
    teleVerificationApplications,
    // Tele-verification stats
    totalTeleverifications,
    pendingTeleverifications,
    completedTeleverifications,
    // Panel interview stats
    totalPanels,
    totalBatches,
    totalEvaluations,
    // Class stats
    upcomingClassesCount,
    engagementRate,
  });
});

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private/Admin
const getRecentActivities = asyncHandler(async (req, res) => {
  // Get recent applications
  const recentApplications = await Application.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("studentName createdAt");

  // Get recent tele-verifications
  const recentTeleverifications = await Televerification.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("application", "studentName")
    .select("status createdAt");

  // Get recent evaluations
  const recentEvaluations = await InterviewEvaluation.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("application", "studentName")
    .populate("panel", "name")
    .select("recommendation createdAt");

  // Combine and format activities
  const activities = [
    ...recentApplications.map((app) => ({
      type: "New Application",
      description: `${app.studentName} submitted an application`,
      timestamp: app.createdAt,
    })),
    ...recentTeleverifications.map((tv) => ({
      type: "Tele-verification Updated",
      description: `${tv.application.studentName} - ${tv.status}`,
      timestamp: tv.createdAt,
    })),
    ...recentEvaluations.map((ev) => ({
      type: "Interview Evaluation",
      description: `${ev.application.studentName} - ${ev.recommendation}`,
      timestamp: ev.createdAt,
    })),
  ];

  // Sort by timestamp and limit to 10
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  activities.splice(10);

  res.json(activities);
});

// @desc    Get upcoming sessions
// @route   GET /api/dashboard/upcoming-sessions
// @access  Private/Admin
const getUpcomingSessions = asyncHandler(async (req, res) => {
  const sessions = [
    { title: "Mathematics - Grade 10", timestamp: "Today, 3:00 PM" },
    { title: "Physics - Grade 12", timestamp: "Tomorrow, 10:00 AM" },
    { title: "Chemistry - Grade 11", timestamp: "Tomorrow, 2:00 PM" },
  ];
  res.json(sessions);
});

// @desc    Get detailed application statistics
// @route   GET /api/dashboard/applications/stats
// @access  Private/Admin
const getApplicationStats = asyncHandler(async (req, res) => {
  // Get applications by status
  const statusStats = await Application.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get applications by education level
  const educationStats = await Application.aggregate([
    {
      $group: {
        _id: "$educationLevel",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get applications over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timeSeriesStats = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);

  res.json({
    statusStats,
    educationStats,
    timeSeriesStats,
  });
});

// @desc    Get detailed tele-verification statistics
// @route   GET /api/dashboard/televerification/stats
// @access  Private/Admin
const getTeleverificationStats = asyncHandler(async (req, res) => {
  // Get tele-verification by status
  const statusStats = await Televerification.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get tele-verification completion rate
  const totalCount = await Televerification.countDocuments();
  const completedCount = await Televerification.countDocuments({
    status: "completed",
  });
  const completionRate =
    totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : 0;

  // Get average processing time
  const processingTimeStats = await Televerification.aggregate([
    {
      $match: {
        status: "completed",
        updatedAt: { $exists: true },
      },
    },
    {
      $project: {
        processingTime: {
          $divide: [
            { $subtract: ["$updatedAt", "$createdAt"] },
            1000 * 60 * 60, // Convert to hours
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ]);

  res.json({
    statusStats,
    completionRate,
    avgProcessingTime: processingTimeStats[0]?.avgProcessingTime || 0,
  });
});

// @desc    Get detailed panel statistics
// @route   GET /api/dashboard/panels/stats
// @access  Private/Admin
const getPanelStats = asyncHandler(async (req, res) => {
  // Get panel statistics
  const totalPanels = await Panel.countDocuments();
  const activePanels = await Panel.countDocuments({ status: "active" });
  const completedPanels = await Panel.countDocuments({ status: "completed" });

  // Get evaluation statistics
  const evaluationStats = await InterviewEvaluation.aggregate([
    {
      $group: {
        _id: "$recommendation",
        count: { $sum: 1 },
      },
    },
  ]);

  // Get batch statistics
  const batchStats = await Batch.aggregate([
    {
      $project: {
        studentCount: { $size: "$students" },
      },
    },
    {
      $group: {
        _id: null,
        totalBatches: { $sum: 1 },
        avgStudentsPerBatch: { $avg: "$studentCount" },
        totalStudents: { $sum: "$studentCount" },
      },
    },
  ]);

  res.json({
    panelStats: {
      total: totalPanels,
      active: activePanels,
      completed: completedPanels,
    },
    evaluationStats,
    batchStats: batchStats[0] || {
      totalBatches: 0,
      avgStudentsPerBatch: 0,
      totalStudents: 0,
    },
  });
});

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getUpcomingSessions,
  getApplicationStats,
  getTeleverificationStats,
  getPanelStats,
};
