const express = require('express');
const router = express.Router();
const { getTickets, createTicket, addMessage, closeTicket } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTickets)
    .post(protect, createTicket);

router.post('/:id/message', protect, addMessage);
router.put('/:id/close', protect, closeTicket);

module.exports = router;
