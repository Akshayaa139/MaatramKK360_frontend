const mongoose = require("mongoose");

const QuickQuizResponseSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    answers: [{ question: String, selectedIndex: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuickQuizResponse", QuickQuizResponseSchema);
