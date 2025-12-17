const mongoose = require('mongoose');

const televerificationSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
    },
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Rejected'],
        default: 'Pending',
    },
    remarks: {
        type: String,
    },
    callDate: { type: Date },
    callDurationMinutes: { type: Number },
    communicationSkills: { type: Number, min: 0, max: 100 },
    subjectKnowledge: { type: Number, min: 0, max: 100 },
    confidenceLevel: { type: Number, min: 0, max: 100 },
    familySupport: { type: Number, min: 0, max: 100 },
    financialNeed: { type: Number, min: 0, max: 100 },
    overallRating: { type: Number, min: 0, max: 100 },
    recommendation: { type: String, enum: ['selected', 'rejected', 'waitlist', 'neutral'] },
    comments: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Televerification', televerificationSchema);
