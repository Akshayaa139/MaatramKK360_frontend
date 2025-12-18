const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const Student = require('../models/Student');

// @desc    Get assignments for a class or all classes owned by tutor
// @route   GET /api/assignments/:classId
// @access  Private/Tutor
const getAssignments = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (classId === 'all') {
    const Tutor = require('../models/Tutor');
    const Class = require('../models/Class');
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) {
      return res.json([]);
    }
    const classes = await Class.find({ tutor: tutor._id }).select('_id');
    const classIds = classes.map(c => c._id);
    const assignments = await Assignment.find({ class: { $in: classIds } });
    return res.json(assignments);
  }
  const assignments = await Assignment.find({ class: classId });
  res.json(assignments);
});

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Tutor
const createAssignment = asyncHandler(async (req, res) => {

  const { classId, title, description, dueDate } = req.body;

  // Ensure classId is present
  if (!classId) {
    return res.status(400).json({ message: "Class ID is required" });
  }

  const assignment = new Assignment({
    class: classId,
    title,
    description,
    dueDate,
    file: req.file ? req.file.path : null,
  });

  const createdAssignment = await assignment.save();
  res.status(201).json(createdAssignment);
});

// @desc    Update an assignment
// @route   PUT /api/assignments/:assignmentId
// @access  Private/Tutor
const updateAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;

  const assignment = await Assignment.findById(req.params.assignmentId);

  if (assignment) {
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.dueDate = dueDate || assignment.dueDate;

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  } else {
    res.status(404);
    throw new Error('Assignment not found');
  }
});

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:assignmentId
// @access  Private/Tutor
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);

  if (assignment) {
    await assignment.deleteOne();
    res.json({ message: 'Assignment removed' });
  } else {
    res.status(404);
    throw new Error('Assignment not found');
  }
});

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment };

// @desc    Get assignments for a class for the logged-in student
// @route   GET /api/assignments/student/:classId
// @access  Private/Student
// @desc    Get assignments for a class for the logged-in student
// @route   GET /api/assignments/student/:classId
// @access  Private/Student
const getAssignmentsForStudent = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  console.log(`getAssignmentsForStudent called. ClassId: ${classId}, User: ${req.user._id}`);

  const StudentModel = require('../models/Student');
  const ClassModel = require('../models/Class');

  const student = await StudentModel.findOne({ user: req.user._id });
  if (!student) {
    console.log("Student not found for user:", req.user._id);
    return res.status(404).json({ message: 'Student not found' });
  }
  console.log("Found student:", student._id);

  if (classId === 'all') {
    // Find all classes the student is enrolled in OR mapped to
    const query = { $or: [{ students: student._id }] };

    if (student.tutor) {
      // Add mapped tutor classes logic (optionally filtered by subject if needed, 
      // but 'all' usually implies all available)
      query.$or.push({ tutor: student.tutor });
    }

    const classes = await ClassModel.find(query).select('_id');
    const classIds = classes.map(c => c._id);
    console.log("Student enrolled in classes:", classIds);

    const assignments = await Assignment.find({ class: { $in: classIds } })
      .populate('class', 'title');
    console.log("Found assignments:", assignments.length);
    return res.json(assignments);
  }

  // Check if student is enrolled OR if class belongs to mapped tutor
  const belongs = await ClassModel.exists({ _id: classId, students: student._id });
  let isMappedTutorClass = false;

  if (!belongs && student.tutor) {
    isMappedTutorClass = await ClassModel.exists({ _id: classId, tutor: student.tutor });
  }

  if (!belongs && !isMappedTutorClass) {
    console.log(`Student ${student._id} not enrolled in class ${classId} and not mapped to tutor`);
    return res.status(403).json({ message: 'Not enrolled in this class' });
  }

  const assignments = await Assignment.find({ class: classId });
  res.json(assignments);
});

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assignment = await Assignment.findById(id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Check if student already submitted
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const alreadySubmitted = assignment.submissions.find(
    (r) => r.student.toString() === student._id.toString()
  );

  const submissionData = {
    student: student._id,
    file: req.file ? req.file.path : null, // Assuming file upload middleware
    submittedAt: Date.now(),
  };

  if (alreadySubmitted) {
    // Update existing submission
    assignment.submissions = assignment.submissions.map((sub) =>
      sub.student.toString() === student._id.toString() ? { ...sub, ...submissionData, grade: sub.grade } : sub
    );
  } else {
    // Add new submission
    assignment.submissions.push(submissionData);
    assignment.submissionCount = (assignment.submissionCount || 0) + 1; // Assuming you track this, otherwise length of array
  }

  await assignment.save();
  res.status(201).json({ message: 'Assignment submitted successfully' });
});

// @desc    Grade a submission
// @route   POST /api/assignments/:id/grade
// @access  Private/Tutor
const gradeAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentId, grade } = req.body; // Expecting grade as string or whatever structure

  const assignment = await Assignment.findById(id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  const submission = assignment.submissions.find(
    (sub) => sub.student.toString() === studentId
  );

  if (submission) {
    submission.grade = grade;
    await assignment.save();
    res.json({ message: 'Grade updated successfully' });
  } else {
    res.status(404);
    throw new Error('Submission not found');
  }
});

// @desc    Get assignment details (for Tutor to view submissions)
// @route   GET /api/assignments/:id/details
// @access  Private/Tutor
const getAssignmentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Populate student details in submissions
  const assignment = await Assignment.findById(id)
    .populate('submissions.student', 'name email'); // Populate specific fields from Student/User

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  // Also Populate user info if 'Student' model refs 'User'
  // Usually Student model has 'user' which refs User model. 
  // If Student model has name directly, great. If not, need deep populate.
  // Assuming Student model has basic info or we populate user from it.
  // Let's assume Student model has 'user' field that points to User.
  // .populate({ path: 'submissions.student', populate: { path: 'user', select: 'name email' } })

  res.json(assignment);
});

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentsForStudent,
  submitAssignment,
  gradeAssignment,
  getAssignmentDetails
};
