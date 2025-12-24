const express = require('express');
const router = express.Router();
const { sendMessage, getMyMessages, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/', protect, getMyMessages);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
