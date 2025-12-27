const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Discussion = require('../models/Discussion');
const Feedback = require('../models/Feedback');

// Discussions
const getDiscussions = asyncHandler(async (req, res) => {
    const discussions = await Discussion.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(discussions);
});

const createDiscussion = asyncHandler(async (req, res) => {
    const { title, subject, content, tags } = req.body;
    const discussion = await Discussion.create({
        author: req.user._id,
        title,
        subject,
        content,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : [])
    });
    res.status(201).json(discussion);
});

const likeDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
        res.status(404);
        throw new Error('Discussion not found');
    }

    const index = discussion.likes.indexOf(req.user._id);
    if (index === -1) {
        discussion.likes.push(req.user._id);
    } else {
        discussion.likes.splice(index, 1);
    }

    await discussion.save();
    res.json(discussion);
});

// Feedback
const getFeedback = asyncHandler(async (req, res) => {
    const feedback = await Feedback.find({ student: req.user._id }).populate('tutor', 'name').sort({ createdAt: -1 });
    res.json(feedback);
});

const createFeedback = asyncHandler(async (req, res) => {
    const { tutor, subject, rating, comment } = req.body;

    let tutorId = null;

    // Check if it's already a valid ObjectId
    if (tutor && mongoose.Types.ObjectId.isValid(tutor)) {
        tutorId = tutor;
    } else if (tutor) {
        // Find by name
        const User = require('../models/User');
        const tutorUser = await User.findOne({
            name: { $regex: new RegExp("^" + tutor.trim() + "$", "i") },
            role: 'tutor'
        });
        if (tutorUser) {
            tutorId = tutorUser._id;
        }
    }

    if (!tutorId) {
        res.status(400);
        throw new Error('Tutor not found. Please enter a valid tutor name.');
    }

    const feedback = await Feedback.create({
        student: req.user._id,
        tutor: tutorId,
        subject,
        rating,
        comment
    });
    res.status(201).json(feedback);
});

module.exports = {
    getDiscussions,
    createDiscussion,
    likeDiscussion,
    getFeedback,
    createFeedback
};
