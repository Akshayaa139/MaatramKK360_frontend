const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');

// @desc    Get all assignments for a class
// @route   GET /api/assignments/:classId
// @access  Private/Tutor
const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ class: req.params.classId });
  res.json(assignments);
});

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private/Tutor
const createAssignment = asyncHandler(async (req, res) => {
  const { classId, title, description, dueDate } = req.body;

  const assignment = new Assignment({
    class: classId,
    title,
    description,
    dueDate,
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
    await assignment.remove();
    res.json({ message: 'Assignment removed' });
  } else {
    res.status(404);
    throw new Error('Assignment not found');
  }
});

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment };