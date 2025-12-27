const mongoose = require('mongoose');

const mentoringSessionSchema = new mongoose.Schema({
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    title: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    notes: {
        type: String
    },
    message: {
        type: String // Message from student for request
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MentoringSession', mentoringSessionSchema);
