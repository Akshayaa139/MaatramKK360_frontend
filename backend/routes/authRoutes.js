const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, debugResetPassword, requestPasswordReset, performPasswordReset } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile
router.get('/profile', protect, getUserProfile);

// Debug-only password reset (requires X-Debug-Reset header)
router.post('/debug/reset', debugResetPassword);

// Password reset
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', performPasswordReset);

module.exports = router;
