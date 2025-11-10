const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    timeslot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Timeslot',
        required: true,
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
    },
    meetingLink: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Panel', panelSchema);