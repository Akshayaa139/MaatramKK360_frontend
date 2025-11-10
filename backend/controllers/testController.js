const asyncHandler = require('express-async-handler');

// @desc    Get test statistics
// @route   GET /api/tests/stats
// @access  Private/Admin
const getTestStats = asyncHandler(async (req, res) => {
    const stats = {
        upcomingTests: 3,
        studentsRegistered: 150,
        resultsPublished: 5,
        averageScore: 78,
    };
    res.json(stats);
});

// @desc    Get upcoming tests
// @route   GET /api/tests/upcoming
// @access  Private/Admin
const getUpcomingTests = asyncHandler(async (req, res) => {
    const upcomingTests = [
        { id: 1, title: "Mathematics Scholarship Test", date: "2024-09-01", registered: 45 },
        { id: 2, title: "Science Olympiad Qualifier", date: "2024-09-15", registered: 60 },
        { id: 3, title: "English Proficiency Assessment", date: "2024-10-01", registered: 45 },
    ];
    res.json(upcomingTests);
});

module.exports = { getTestStats, getUpcomingTests };