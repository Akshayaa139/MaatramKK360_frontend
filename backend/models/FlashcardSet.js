const mongoose = require("mongoose");

const FlashcardSetSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor" },
    title: { type: String, required: true },
    subject: { type: String },
    cards: [
      {
        question: { type: String, required: true },
        choices: [{ type: String }],
        correctIndex: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlashcardSet", FlashcardSetSchema);
