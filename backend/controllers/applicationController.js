const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const NotificationService = require('../services/notificationService');
const PdfService = require('../services/pdfService');

// @desc    Submit a new application
// @route   POST /api/applications/submit
// @access  Public
exports.submitApplication = asyncHandler(async (req, res) => {
    try {
        // Parse form data
        let formData = {};
        
        // Handle JSON stringified data
        if (req.body.applicationData) {
            formData = JSON.parse(req.body.applicationData);
        } else {
            // Handle individual fields
            formData = {
                fullName: req.body.fullName,
                dateOfBirth: req.body.dateOfBirth,
                gender: req.body.gender,
                email: req.body.email,
                phone: req.body.phone,
                whatsappNumber: req.body.whatsappNumber,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pincode,
                currentClass: req.body.currentClass,
                schoolName: req.body.schoolName,
                board: req.body.board,
                medium: req.body.medium,
                subjects: typeof req.body.subjects === 'string' ? JSON.parse(req.body.subjects) : req.body.subjects,
                fatherName: req.body.fatherName,
                motherName: req.body.motherName,
                fatherOccupation: req.body.fatherOccupation,
                motherOccupation: req.body.motherOccupation,
                annualIncome: req.body.annualIncome,
                tenthPercentage: req.body.tenthPercentage,
                currentPercentage: req.body.currentPercentage,
                whyKK: req.body.whyKK,
                goals: req.body.goals,
                challenges: req.body.challenges
            };
        }

        // Handle file uploads
        const files = {};
        if (req.files) {
            if (req.files.photoFile) files.photo = req.files.photoFile[0].path;
            if (req.files.marksheetFile) files.marksheet = req.files.marksheetFile[0].path;
            if (req.files.incomeCertificateFile) files.incomeCertificate = req.files.incomeCertificateFile[0].path;
            if (req.files.idProofFile) files.idProof = req.files.idProofFile[0].path;
        }

        // Create application object
        const rawGender = (formData.gender || formData.personalInfo?.gender || '');
        const genderValue = typeof rawGender === 'string' ? rawGender.toLowerCase() : rawGender;
        const normalizedGender = genderValue === 'male' ? 'Male' : genderValue === 'female' ? 'Female' : genderValue === 'other' ? 'Other' : (formData.gender || formData.personalInfo?.gender);

        const subjectsInput = formData.subjects ?? formData.educationalInfo?.subjects ?? [];
        let subjectsArr;
        if (typeof subjectsInput === 'string') {
            try {
                const parsed = JSON.parse(subjectsInput);
                subjectsArr = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                subjectsArr = subjectsInput.includes(',') ? subjectsInput.split(',').map(s => s.trim()).filter(Boolean) : [subjectsInput];
            }
        } else {
            subjectsArr = Array.isArray(subjectsInput) ? subjectsInput : [];
        }
        const normalizedSubjects = subjectsArr.map(s => (typeof s === 'string' ? { name: s, medium: formData.medium || formData.educationalInfo?.medium } : s));

        const applicationData = {
            personalInfo: {
                fullName: formData.fullName || formData.personalInfo?.fullName,
                dateOfBirth: formData.dateOfBirth || formData.personalInfo?.dateOfBirth,
                gender: normalizedGender,
                email: formData.email || formData.personalInfo?.email,
                phone: formData.phone || formData.personalInfo?.phone,
                whatsappNumber: formData.whatsappNumber,
                address: {
                    street: formData.address || formData.personalInfo?.address?.street,
                    city: formData.city || formData.personalInfo?.address?.city,
                    state: formData.state || formData.personalInfo?.address?.state,
                    pincode: formData.pincode || formData.personalInfo?.address?.pincode
                }
            },
            educationalInfo: {
                currentClass: formData.currentClass,
                schoolName: formData.schoolName || formData.educationalInfo?.schoolName,
                board: formData.board || formData.educationalInfo?.board,
                medium: formData.medium || formData.educationalInfo?.medium,
                subjects: normalizedSubjects,
                tenthPercentage: formData.tenthPercentage,
                currentPercentage: formData.currentPercentage
            },
            familyInfo: {
                fatherName: formData.fatherName || formData.familyInfo?.fatherName,
                motherName: formData.motherName || formData.familyInfo?.motherName,
                fatherOccupation: formData.fatherOccupation || formData.familyInfo?.fatherOccupation,
                motherOccupation: formData.motherOccupation || formData.familyInfo?.motherOccupation,
                annualIncome: formData.annualIncome || formData.familyInfo?.annualIncome
            },
            documents: files,
            additionalInfo: {
                whyKK: formData.whyKK,
                goals: formData.goals,
                challenges: formData.challenges
            },
            status: 'pending'
        };

        // Create and save application (applicationId will be auto-generated by pre-save hook)
        const application = new Application(applicationData);
        await application.save();

        // Generate PDF asynchronously (don't wait for it)
        PdfService.generateApplicationPdf(application)
            .then(pdfPath => {
                application.applicationPdf = pdfPath;
                return application.save();
            })
            .catch(err => console.error('PDF generation error:', err));

        // Send notification
        NotificationService.sendApplicationConfirmation(application)
            .catch(err => console.error('Notification error:', err));

        res.status(201).json({ 
            success: true,
            message: 'Application submitted successfully!', 
            applicationId: application.applicationId 
        });
    } catch (error) {
        console.error('Application submission error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message || 'Application submission failed' 
        });
    }
});

// @desc    Get application status
// @route   GET /api/applications/status/:applicationId
// @access  Public
exports.getApplicationStatus = asyncHandler(async (req, res) => {
    const application = await Application.findOne({ applicationId: req.params.applicationId });
    
    if (!application) {
        return res.status(404).json({ 
            success: false,
            message: 'Application not found' 
        });
    }

    res.json({
        success: true,
        applicationId: application.applicationId,
        status: application.status,
        submittedAt: application.createdAt
    });
});