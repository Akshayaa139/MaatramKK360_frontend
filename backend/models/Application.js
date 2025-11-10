const mongoose = require('mongoose');
const crypto = require('crypto');

const applicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    education: {
        type: String,
        required: true,
    },
    documents: [
        {
            type: String,
        },
    ],
    status: {
        type: String,
        enum: ['pending', 'tele-verification', 'panel-interview', 'selected', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

applicationSchema.pre('save', function (next) {
    if (!this.applicationId) {
        this.applicationId = `KK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    next();
});

module.exports = mongoose.model('Application', applicationSchema);