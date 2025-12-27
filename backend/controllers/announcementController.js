const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find()
        .populate('author', 'name')
        .populate('class', 'title subject')
        .sort({ createdAt: -1 });
    res.json(announcements);
});

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private/Tutor, Admin
const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, message, targetClass } = req.body;

    const announcement = await Announcement.create({
        author: req.user._id,
        title,
        message,
        class: targetClass
    });

    res.status(201).json(announcement);
});

module.exports = {
    getAnnouncements,
    createAnnouncement
};
