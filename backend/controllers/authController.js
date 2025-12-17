const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const NotificationService = require('../services/notificationService');

// Generate JWT
const jwtSecret = process.env.JWT_SECRET || 'devsecret';
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phone
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Primary check: bcrypt hashed password
    const hashedMatch = await user.matchPassword(password);

    // Fallback for legacy users with plaintext passwords stored
    const plaintextMatch = !hashedMatch && (user.password === password);

    if (hashedMatch || plaintextMatch) {
      // If legacy plaintext matched, migrate by hashing and saving
      if (plaintextMatch) {
        user.password = password;
        await user.save();
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
// Debug-only: reset a user's password by email (case-insensitive)
// Enabled only when DEBUG_RESET_TOKEN is provided and matches header 'X-Debug-Reset'
const debugResetPassword = async (req, res) => {
  try {
    const token = req.headers['x-debug-reset'];
    if (!process.env.DEBUG_RESET_TOKEN || token !== process.env.DEBUG_RESET_TOKEN) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { email, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = String(newPassword || 'Admin@123');
    await user.save();
    res.json({ message: 'Password reset', email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports.debugResetPassword = debugResetPassword;

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
    if (!user) return res.status(200).json({ message: 'If account exists, email sent' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await NotificationService.sendEmail(
      user.email,
      'KK360 Password Reset',
      `Click to reset your password: ${resetUrl}`,
      `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      'notifications'
    );

    res.json({ message: 'Reset email sent' });
  } catch (e) {
    console.error('Password reset request failed', e);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Perform password reset
const performPasswordReset = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const hashed = crypto.createHash('sha256').update(String(token || '')).digest('hex');
    const user = await User.findOne({
      email: new RegExp('^' + normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = String(newPassword || '');
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('Password reset failed', e);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports.requestPasswordReset = requestPasswordReset;
module.exports.performPasswordReset = performPasswordReset;
