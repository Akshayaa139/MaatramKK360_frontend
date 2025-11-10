const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const NotificationService = require('../services/notificationService');
const PdfService = require('../services/pdfService');

// @desc    Submit a new application
// @route   POST /api/applications
// @access  Public
exports.submitApplication = asyncHandler(async (req, res) => {
    const application = new Application(req.body);
    await application.save();

    // Generate PDF
    const pdfPath = await PdfService.generateApplicationPdf(application);

    // Update application with PDF path
    application.applicationPdf = pdfPath;
    await application.save();

    // Send notification
    await NotificationService.sendApplicationConfirmation(application);

    res.status(201).json({ 
        message: 'Application submitted successfully!', 
        applicationId: application.applicationId 
    });
});