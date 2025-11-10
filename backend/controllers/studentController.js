const asyncHandler = require('express-async-handler');

// @desc    Get students pending panel interview
// @route   GET /api/students/pending-panel
// @access  Private/Admin
const getStudentsPendingPanel = asyncHandler(async (req, res) => {
    const students = [
        { id: '1', name: 'Aarav Sharma', applicationStatus: 'Tele-verification complete' },
        { id: '2', name: 'Diya Patel', applicationStatus: 'Tele-verification complete' },
        { id: '3', name: 'Rohan Mehta', applicationStatus: 'Tele-verification complete' },
    ];
    res.json(students);
});

module.exports = { getStudentsPendingPanel };