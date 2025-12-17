const mongoose = require('mongoose');
const crypto = require('crypto');

const applicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        unique: true,
        sparse: true,
    },
    applicationNumber: {
        type: String,
        unique: true
    },
    aadhaarNumber: {
        type: String,
        default: undefined
    },
    // Personal Information
    personalInfo: {
        fullName: { type: String, required: true },
        dateOfBirth: { type: String },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], set: v => (typeof v === 'string' ? (v.toLowerCase()==='male'?'Male':v.toLowerCase()==='female'?'Female':v.toLowerCase()==='other'?'Other':v) : v) },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        whatsappNumber: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            pincode: { type: String }
        }
    },
    // Educational Information
    educationalInfo: {
        currentClass: { type: String },
        schoolName: { type: String },
        board: { type: String },
        medium: { type: String },
        subjects: {
            type: [{
                name: { type: String },
                medium: { type: String }
            }],
            set: function(v) {
                if (!v) return [];
                if (typeof v === 'string') return [{ name: v, medium: this.educationalInfo?.medium }];
                if (Array.isArray(v)) return v.map(s => typeof s === 'string' ? { name: s, medium: this.educationalInfo?.medium } : s);
                return [v];
            }
        },
        tenthPercentage: { type: String },
        currentPercentage: { type: String }
    },
    // Family Information
    familyInfo: {
        fatherName: { type: String },
        motherName: { type: String },
        fatherOccupation: { type: String },
        motherOccupation: { type: String },
        annualIncome: { type: String }
    },
    // Documents (file paths)
    documents: {
        photo: { type: String },
        marksheet: { type: String },
        incomeCertificate: { type: String },
        idProof: { type: String }
    },
    // Additional Information
    additionalInfo: {
        whyKK: { type: String },
        goals: { type: String },
        challenges: { type: String }
    },
    // PDF path
    applicationPdf: { type: String },
    // Tutor assignment details
    tutorAssignment: {
        tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' },
        meetingLink: { type: String },
        schedule: {
            day: { type: String },
            startTime: { type: String },
            endTime: { type: String }
        }
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'tele-verification', 'panel-interview', 'selected', 'rejected', 'waitlist'],
        default: 'pending',
    },
    // Legacy fields for backward compatibility
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    education: { type: String }
}, {
    timestamps: true,
});

applicationSchema.index({ aadhaarNumber: 1 }, { unique: true, sparse: true });

// Auto-generate application ID before saving
applicationSchema.pre('save', function (next) {
    if (!this.applicationId) {
        // Generate format: KK2025-STU0001 (year + sequential number)
        const year = new Date().getFullYear();
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.applicationId = `KK${year}-${randomPart}`;
        this.applicationNumber = this.applicationId;
    }

    if (!this.applicationNumber) {
        this.applicationNumber = this.applicationId;
    }

    if (!this.aadhaarNumber) {
        this.aadhaarNumber = this.applicationId;
    }
    
    // Populate legacy fields for backward compatibility
    if (!this.name && this.personalInfo?.fullName) {
        this.name = this.personalInfo.fullName;
    }
    if (!this.email && this.personalInfo?.email) {
        this.email = this.personalInfo.email;
    }
    if (!this.phone && this.personalInfo?.phone) {
        this.phone = this.personalInfo.phone;
    }
    if (!this.address && this.personalInfo?.address) {
        this.address = `${this.personalInfo.address.street}, ${this.personalInfo.address.city}, ${this.personalInfo.address.state}`;
    }
    
    next();
});

module.exports = mongoose.model('Application', applicationSchema);
