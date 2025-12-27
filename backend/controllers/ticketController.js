const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');

// @desc    Get all tickets for logged in user
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
});

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
    const { subject, category, priority, description } = req.body;

    if (!subject || !category || !priority || !description) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const ticket = await Ticket.create({
        user: req.user._id,
        subject,
        category,
        priority,
        messages: [{
            sender: req.user._id,
            message: description
        }]
    });

    res.status(201).json(ticket);
});

// @desc    Add message to ticket
// @route   POST /api/tickets/:id/message
// @access  Private
const addMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    // Only user or admin/support can add message (simplified for now)
    ticket.messages.push({
        sender: req.user._id,
        message
    });

    await ticket.save();
    res.json(ticket);
});

// @desc    Close ticket
// @route   PUT /api/tickets/:id/close
// @access  Private
const closeTicket = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    ticket.status = 'closed';
    await ticket.save();

    res.json(ticket);
});

module.exports = {
    getTickets,
    createTicket,
    addMessage,
    closeTicket
};
