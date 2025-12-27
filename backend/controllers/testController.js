const asyncHandler = require('express-async-handler');
const Test = require('../models/Test');
const Tutor = require('../models/Tutor');
const Class = require('../models/Class');

// @desc    Get test statistics
// @route   GET /api/tests/stats
// @access  Private/Admin
const getTestStats = asyncHandler(async (req, res) => {
  const upcoming = await Test.countDocuments({ date: { $gte: new Date() } });
  const recentResults = await Test.countDocuments({ 'submissions.marks': { $exists: true } });
  const avgAgg = await Test.aggregate([
    { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: true } },
    { $match: { 'submissions.marks': { $exists: true } } },
    { $group: { _id: null, avg: { $avg: '$submissions.marks' } } }
  ]);
  const averageScore = Math.round((avgAgg[0]?.avg || 0) * 100) / 100;
  res.json({ upcomingTests: upcoming, studentsRegistered: 0, resultsPublished: recentResults, averageScore });
});

// @desc    Get upcoming tests
// @route   GET /api/tests/upcoming
// @access  Private/Admin
const getUpcomingTests = asyncHandler(async (req, res) => {
  const upcomingTests = await Test.find({ date: { $gte: new Date() } }).select('title date').sort({ date: 1 }).lean();
  const mapped = upcomingTests.map(t => ({ id: String(t._id), title: t.title, date: t.date, registered: 0 }));
  res.json(mapped);
});

// @desc    Get tests for a class or all classes owned by tutor
// @route   GET /api/tests/:classId
// @access  Private/Tutor
const getTests = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (classId === 'all') {
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) return res.json([]);
    const classes = await Class.find({ tutor: tutor._id }).select('_id');
    const classIds = classes.map(c => c._id);
    const tests = await Test.find({ class: { $in: classIds } });
    return res.json(tests);
  }
  const tests = await Test.find({ class: classId });
  res.json(tests);
});

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private/Tutor
const createTest = asyncHandler(async (req, res) => {
  const { class: classId, title, description, date, duration, questions } = req.body;
  const test = new Test({
    class: classId,
    title,
    description,
    date,
    duration: Number(duration),
    questions: Array.isArray(questions) ? questions : [],
  });
  const created = await test.save();
  res.status(201).json(created);
});

// @desc    Update a test
// @route   PUT /api/tests/:testId
// @access  Private/Tutor
const updateTest = asyncHandler(async (req, res) => {
  const { title, description, date, duration, questions, status } = req.body;
  console.log('--- UPDATE TEST PAYLOAD ---');
  console.log('TestID:', req.params.testId);
  console.log('Questions Count in Payload:', Array.isArray(questions) ? questions.length : 'N/A');

  const test = await Test.findById(req.params.testId);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  if (typeof title === 'string') test.title = title;
  if (typeof description === 'string') test.description = description;
  if (date) test.date = date;
  if (duration !== undefined) test.duration = Number(duration);
  if (questions) test.questions = questions;
  if (status) test.status = status;

  const updated = await test.save();
  res.json(updated);
});

// @desc    Delete a test
// @route   DELETE /api/tests/:testId
// @access  Private/Tutor
const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.testId);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  await test.deleteOne();
  res.json({ message: 'Test removed' });
});

module.exports = { getTestStats, getUpcomingTests, getTests, createTest, updateTest, deleteTest };

// @desc    Get tests for a class for the logged-in student
// @route   GET /api/students/tests/:classId
// @access  Private/Student
const Student = require('../models/Student');
const getTestsForStudent = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (classId === 'all') {
    const query = { $or: [{ students: student._id }] };
    if (student.tutor) {
      query.$or.push({ tutor: student.tutor });
    }
    const classes = await Class.find(query).select('_id');
    const classIds = classes.map(c => c._id);
    const tests = await Test.find({ class: { $in: classIds } });
    return res.json(tests);
  }

  const belongs = await Class.exists({ _id: classId, students: student._id });
  let isMappedTutorClass = false;
  if (!belongs && student.tutor) {
    isMappedTutorClass = await Class.exists({ _id: classId, tutor: student.tutor });
  }

  if (!belongs && !isMappedTutorClass) return res.status(403).json({ message: 'Not enrolled in this class' });
  const tests = await Test.find({ class: classId });
  res.json(tests);
});

const submitQuiz = asyncHandler(async (req, res) => {
  const { marks, answers } = req.body;
  const test = await Test.findById(req.params.id || req.params.testId);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check if already submitted
  const alreadySubmitted = test.submissions.find(s => String(s.student) === String(student._id));
  if (alreadySubmitted) {
    alreadySubmitted.marks = marks;
    alreadySubmitted.answers = answers;
    alreadySubmitted.submittedAt = Date.now();
  } else {
    test.submissions.push({
      student: student._id,
      marks,
      answers,
      submittedAt: Date.now()
    });
  }

  await test.save();
  res.json({ message: 'Quiz submitted', marks });
});

module.exports = {
  getTestStats,
  getUpcomingTests,
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestsForStudent,
  submitQuiz
};
