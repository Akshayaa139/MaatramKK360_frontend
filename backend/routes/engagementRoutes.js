const express = require('express');
const router = express.Router();
const {
    getDiscussions, createDiscussion, likeDiscussion,
    getFeedback, createFeedback
} = require('../controllers/engagementController');
const { protect } = require('../middleware/authMiddleware');

router.route('/discussions')
    .get(protect, getDiscussions)
    .post(protect, createDiscussion);

router.post('/discussions/:id/like', protect, likeDiscussion);

router.route('/feedback')
    .get(protect, getFeedback)
    .post(protect, createFeedback);

module.exports = router;
