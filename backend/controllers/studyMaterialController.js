const asyncHandler = require("express-async-handler");
const StudyMaterial = require("../models/StudyMaterial");
const Tutor = require("../models/Tutor");

// @desc Tutor: create study material (link or metadata)
// @route POST /api/tutor/study-materials
// @access Private/Tutor
const createStudyMaterial = asyncHandler(async (req, res) => {
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  const { title, description, type, url, subjects, summary, steps } = req.body || {};
  if (!title) return res.status(400).json({ message: "title required" });
  const mat = await StudyMaterial.create({
    tutor: tutor._id,
    title,
    description,
    summary: summary || description || "",
    steps: Array.isArray(steps) ? steps : (steps ? steps.split(',').map(s => s.trim()) : []),
    type: type || "link",
    url: url || "",
    subjects: Array.isArray(subjects) ? subjects : [],
  });
  res.json({ message: "Created", material: mat });
});

// @desc Student: list study materials relevant to student's subjects (or all)
// @route GET /api/study-materials
// @access Public (or Private/Student optional)
const listStudyMaterials = asyncHandler(async (req, res) => {
  const { subject } = req.query || {};
  const q = {};
  if (subject) q.subjects = subject;
  const materials = await StudyMaterial.find(q)
    .populate("tutor", "user")
    .sort({ createdAt: -1 })
    .lean();
  res.json(materials);
});

// @desc Tutor: upload a file (video/pdf/image) and create material record
// @route POST /api/tutor/study-materials/upload
// @access Private/Tutor
const uploadStudyMaterial = asyncHandler(async (req, res) => {
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  if (!req.file) return res.status(400).json({ message: "file required" });
  const { title, description, subjects, summary, steps } = req.body || {};
  if (!title) return res.status(400).json({ message: "title required" });
  const file = req.file;
  // determine type
  let type = "other";
  if (file.mimetype.startsWith("video/")) type = "video";
  else if (file.mimetype === "application/pdf") type = "pdf";
  else if (file.mimetype.startsWith("image/")) type = "image";

  const mat = await StudyMaterial.create({
    tutor: tutor._id,
    title,
    description,
    summary: summary || description || "",
    steps: Array.isArray(steps) ? steps : (steps ? String(steps).split(',').map(s => s.trim()) : []),
    type,
    filePath: file.filename,
    subjects: Array.isArray(subjects) ? subjects : subjects ? (typeof subjects === 'string' ? subjects.split(',').map(s => s.trim()) : [subjects]) : [],
  });
  res.json({ message: "Uploaded", material: mat });
});

// @desc Tutor: list my uploaded materials
// @route GET /api/tutor/study-materials/my
// @access Private/Tutor
const listMyMaterials = asyncHandler(async (req, res) => {
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  const materials = await StudyMaterial.find({ tutor: tutor._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(materials);
});

// @desc Tutor: delete a study material
// @route DELETE /api/tutor/study-materials/:id
// @access Private/Tutor
const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  const mat = await StudyMaterial.findById(id);
  if (!mat) return res.status(404).json({ message: "Material not found" });
  if (String(mat.tutor) !== String(tutor._id))
    return res.status(403).json({ message: "Forbidden" });
  // remove file if present
  if (mat.filePath) {
    const filePath = require("path").join(
      __dirname,
      "..",
      "uploads",
      "study-materials",
      mat.filePath
    );
    try {
      require("fs").unlinkSync(filePath);
    } catch (e) {
      /* ignore */
    }
  }
  await StudyMaterial.deleteOne({ _id: id });
  res.json({ message: "Deleted" });
});

// @desc Tutor: update study material metadata
// @route PUT /api/tutor/study-materials/:id
// @access Private/Tutor
const updateStudyMaterial = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  const mat = await StudyMaterial.findById(id);
  if (!mat) return res.status(404).json({ message: "Material not found" });
  if (String(mat.tutor) !== String(tutor._id))
    return res.status(403).json({ message: "Forbidden" });

  const { title, description, url, subjects, type, summary, steps } = req.body || {};
  if (typeof title !== "undefined") mat.title = title;
  if (typeof description !== "undefined") mat.description = description;
  if (typeof summary !== "undefined") mat.summary = summary;
  if (typeof steps !== "undefined") mat.steps = Array.isArray(steps) ? steps : (steps ? String(steps).split(',').map(s => s.trim()) : []);
  if (typeof url !== "undefined") mat.url = url;
  if (typeof type !== "undefined") mat.type = type;
  if (typeof subjects !== "undefined")
    mat.subjects = Array.isArray(subjects)
      ? subjects
      : subjects
        ? String(subjects).split(',').map(s => s.trim())
        : [];

  await mat.save();
  res.json({ message: "Updated", material: mat });
});

module.exports = {
  createStudyMaterial,
  listStudyMaterials,
  uploadStudyMaterial,
  listMyMaterials,
  deleteStudyMaterial,
  updateStudyMaterial,
};
