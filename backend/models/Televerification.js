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
}, { timestamps: true });

module.exports = mongoose.model('Televerification', televerificationSchema);