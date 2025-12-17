const mongoose = require('mongoose');

const TutorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  qualifications: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  subjectPreferences: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  leaveDate: {
    type: Date
  }
});

module.exports = mongoose.model('Tutor', TutorSchema);
