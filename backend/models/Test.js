const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  fileUrl: {
    type: String,
  },
  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
      file: {
        type: String,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      marks: {
        type: Number,
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);