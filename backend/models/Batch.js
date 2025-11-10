const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
    }],
    panel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panel',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);