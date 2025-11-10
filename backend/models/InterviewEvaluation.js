const mongoose = require('mongoose');

const interviewEvaluationSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
    },
    panel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panel',
        required: true,
    },
    evaluation: {
        type: Map,
        of: String,
    },
    recommendation: {
        type: String,
        enum: ['Strongly Recommend', 'Recommend', 'Do Not Recommend'],
        required: true,
    },
    comments: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('InterviewEvaluation', interviewEvaluationSchema);