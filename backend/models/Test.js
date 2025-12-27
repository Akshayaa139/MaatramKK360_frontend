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
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled',
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
      answers: [
        {
          questionIndex: Number,
          selectedOption: Number,
        }
      ],
    },
  ],
  questions: [
    {
      questionText: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: Number, required: true }, // Index of the correct option
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);