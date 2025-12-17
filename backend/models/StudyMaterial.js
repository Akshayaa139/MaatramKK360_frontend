const mongoose = require("mongoose");

const StudyMaterialSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["video", "link", "pdf", "image", "other"],
      default: "link",
    },
    url: { type: String },
    filePath: { type: String },
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyMaterial", StudyMaterialSchema);
