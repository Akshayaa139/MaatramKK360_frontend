const mongoose = require('mongoose');

const ClassSessionSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    // Optional: Snapshot of students who were supposed to attend
    expectedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    // Optional: Meeting link used
    sessionLink: String,
    // Event logs for join/leave
    logs: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        action: {
            type: String,
            enum: ['join', 'leave']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    activeParticipants: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('ClassSession', ClassSessionSchema);
