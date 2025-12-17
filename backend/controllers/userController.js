const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10, search } = req.query;
  
  let query = {};
  
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await User.countDocuments(query);
  
  res.json({
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  const validRoles = ['admin', 'lead', 'tutor', 'student', 'volunteer', 'alumni'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Valid roles are: ' + validRoles.join(', '));
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent changing own role
  if (user._id.toString() === req.user.id) {
    res.status(400);
    throw new Error('Cannot change your own role');
  }
  
  user.role = role;
  await user.save();
  
  res.json({
    message: 'User role updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent deactivating own account
  if (user._id.toString() === req.user.id) {
    res.status(400);
    throw new Error('Cannot deactivate your own account');
  }
  
  // Add isActive field if it doesn't exist, or set it to false
  user.isActive = false;
  await user.save();
  
  res.json({
    message: 'User deactivated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isActive: false
    }
  });
});

// @desc    Get user analytics
// @route   GET /api/admin/users/analytics
// @access  Private/Admin
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  // Get users by role
  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get active vs inactive users
  const activeStats = await User.aggregate([
    {
      $group: {
        _id: { $ifNull: ['$isActive', true] },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get users registered over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeSeriesStats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
  
  // Get total count
  const totalUsers = await User.countDocuments();
  
  res.json({
    roleStats,
    activeStats,
    timeSeriesStats,
    totalUsers
  });
});

