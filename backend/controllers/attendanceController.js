const Student = require('../models/Student');
const Class = require('../models/Class');

// @desc    Get attendance for a specific class
// @route   GET /api/attendance/:classId
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    let filter = { 'attendance.class': classId };
    if (date) {
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      filter = { 'attendance.class': classId, 'attendance.date': { $gte: start, $lt: end } };
    }
    const students = await Student.find(filter).populate('user', 'name');

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
      const updated = await Student.updateOne(
        { _id: record.studentId, 'attendance.class': classId },
        { $set: { 'attendance.$.status': record.status } }
      );
      if (!updated.matchedCount) {
        await Student.updateOne(
          { _id: record.studentId },
          { $push: { attendance: { class: classId, status: record.status || 'absent', date: new Date() } } }
        );
      }
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAttendance, updateAttendance };
