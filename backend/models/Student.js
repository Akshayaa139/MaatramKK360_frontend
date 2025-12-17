const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  subjects: [
    {
      type: String,
      required: true,
    },
  ],
  availability: [
    {
      day: { type: String },
      startTime: { type: String }, // HH:MM
      endTime: { type: String }, // HH:MM
    },
  ],
  attendance: [
    {
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
      status: {
        type: String,
        enum: ["present", "absent", "excused"],
        default: "absent",
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  performance: [
    {
      subject: {
        type: String,
        required: true,
      },
      examType: {
        type: String,
        enum: ["mid", "quarterly", "half", "final", "other"],
        default: "other",
      },
      score: {
        type: Number,
        required: true,
      },
      maxScore: {
        type: Number,
        required: true,
      },
      testDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  joinDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Student", StudentSchema);
