const Student = require('../models/Student');
const Class = require('../models/Class');

// @desc    Get attendance for a specific class
// @route   GET /api/attendance/:classId
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const students = await Student.find({ 'attendance.class': classId }).populate('user', 'name');

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update attendance for a specific class
// @route   PUT /api/attendance/:classId
// @access  Private
const updateAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { attendanceData } = req.body; // Expected format: [{ studentId, status }]

    for (const record of attendanceData) {
      await Student.updateOne(
        { _id: record.studentId, 'attendance.class': classId },
        { $set: { 'attendance.$.status': record.status } }
      );
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAttendance, updateAttendance };