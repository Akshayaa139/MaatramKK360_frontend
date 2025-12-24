const Student = require('../models/Student');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// @desc    Get attendance for a specific class
// @route   GET /api/attendance/:classId
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    // Validate classId to avoid casting non-ObjectId values like "all"
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }
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

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ message: 'attendanceData required' });
    }

    const { date } = req.body;

    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    // Use local day boundaries for the query to ensure we capture the record regardless of time stored
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    for (const record of attendanceData) {
      // STRICTLY match a single attendance element that has BOTH the class AND the date
      const query = {
        _id: record.studentId,
        attendance: {
          $elemMatch: {
            class: classId,
            date: { $gte: start, $lt: end }
          }
        }
      };

      const existingStudent = await Student.findOne(query);

      if (existingStudent) {
        // Update the SPECIFIC matched element using the positional operator $
        // The query MUST match the array element for $ to work correctly
        await Student.updateOne(
          query,
          {
            $set: { 'attendance.$.status': record.status }
          }
        );
      } else {
        // Push new record if strictly no matching entry found
        await Student.updateOne(
          { _id: record.studentId },
          {
            $push: {
              attendance: {
                class: classId,
                status: record.status || 'absent',
                date: targetDate // Stores the date provided by frontend
              }
            }
          }
        );
      }
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Fetch all students who have attendance records for this class
    const students = await Student.find({ "attendance.class": classId }).populate("user", "name email");

    let csvContent = "Student Name,Email,Date,Status\n";

    students.forEach(student => {
      const records = student.attendance.filter(a => String(a.class) === classId);
      records.forEach(r => {
        csvContent += `${student.user.name},${student.user.email},${new Date(r.date).toLocaleDateString()},${r.status}\n`;
      });
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=Attendance_${cls.title.replace(/\s+/g, "_")}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAttendance, updateAttendance, exportAttendance };
