const Message = require('../models/Message');
const Tutor = require('../models/Tutor'); // Added

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        console.log("SendMessage Request Body:", req.body);
        console.log("SendMessage User:", req.user?._id);

        let { receiver, content } = req.body;

        if (!receiver || !content) {
            console.log("Missing receiver or content");
            return res.status(400).json({ message: 'Receiver and content are required' });
        }

        console.log("Original Receiver ID:", receiver);

        // Robustness: Check if receiver is actually a Tutor ID, and if so, resolve to User ID
        // Try finding a Tutor with this ID
        try {
            const potentialTutor = await Tutor.findById(receiver);
            if (potentialTutor && potentialTutor.user) {
                console.log(`Resolved Tutor ID ${receiver} to User ID ${potentialTutor.user}`);
                receiver = potentialTutor.user;
            }
        } catch (err) {
            // Ignore error if receiver is not a valid ObjectId or not found in Tutor (it might be a User ID already)
            console.log("Not a tutor ID or lookup failed, assuming User ID");
        }

        console.log("Final Creating message for receiver:", receiver);
        const message = await Message.create({
            sender: req.user._id,
            receiver,
            content
        });
        console.log("Message created:", message._id);

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email')
            .populate('receiver', 'name email');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("SendMessage Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get my messages (received)
// @route   GET /api/messages
// @access  Private
const getMyMessages = async (req, res) => {
    try {
        const messages = await Message.find({ receiver: req.user._id })
            .populate('sender', 'name role')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Ensure only the receiver can mark as read
        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.read = true;
        await message.save();

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    sendMessage,
    getMyMessages,
    markAsRead
};
