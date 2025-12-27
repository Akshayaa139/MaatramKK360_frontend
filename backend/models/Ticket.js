const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['technical', 'account', 'class', 'billing', 'other']
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent']
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'closed'],
        default: 'open'
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
