const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Televerification = require('../models/Televerification');
const Panel = require('../models/Panel');
const Batch = require('../models/Batch');
const InterviewEvaluation = require('../models/InterviewEvaluation');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// @desc    Get all applications with filters
// @route   GET /api/admin/applications
// @access  Private/Admin
const getAllApplications = asyncHandler(async (req, res) => {
  const { status, educationLevel, fromDate, toDate, page = 1, limit = 10 } = req.query;
  
  let query = {};
  
  if (status) query.status = status;
  if (educationLevel) query.educationLevel = educationLevel;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }
  
  const applications = await Application.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('pdfPath', 'path');
  
  const total = await Application.countDocuments(query);
  
  res.json({
    applications,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// @desc    Get single application by ID
// @route   GET /api/admin/applications/:id
// @access  Private/Admin
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  
  res.json(application);
});

// @desc    Update application status
// @route   PUT /api/admin/applications/:id
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  
  const application = await Application.findById(req.params.id);
  
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  
  application.status = status;
  if (remarks) application.remarks = remarks;
  
  await application.save();
  
  res.json({
    message: 'Application status updated successfully',
    application
  });
});

// @desc    Export applications as CSV
// @route   GET /api/admin/applications/export
// @access  Private/Admin
const exportApplications = asyncHandler(async (req, res) => {
  const { status, educationLevel, fromDate, toDate } = req.query;
  
  let query = {};
  
  if (status) query.status = status;
  if (educationLevel) query.educationLevel = educationLevel;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }
  
  const applications = await Application.find(query).sort({ createdAt: -1 });
  
  // Create CSV content
  const csvHeaders = 'Application ID,Student Name,Email,Phone,Education Level,Status,Created Date\n';
  const csvContent = applications.map(app => 
    `${app.applicationNumber},${app.studentName},${app.email},${app.phone},${app.educationLevel},${app.status},${app.createdAt.toISOString()}`
  ).join('\n');
  
  const csvData = csvHeaders + csvContent;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  res.send(csvData);
});

// @desc    Get application analytics
// @route   GET /api/admin/applications/analytics
// @access  Private/Admin
const getApplicationAnalytics = asyncHandler(async (req, res) => {
  // Get applications by status
  const statusStats = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get applications by education level
  const educationStats = await Application.aggregate([
    {
      $group: {
        _id: '$educationLevel',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get applications over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeSeriesStats = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
  
  res.json({
    statusStats,
    educationStats,
    timeSeriesStats
  });
});

module.exports = {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  exportApplications,
  getApplicationAnalytics
};