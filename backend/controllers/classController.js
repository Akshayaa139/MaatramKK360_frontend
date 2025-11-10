const Class = require('../models/Class');
const Tutor = require('../models/Tutor');

// @desc    Get all classes for a specific tutor
// @route   GET /api/classes/tutor
// @access  Private
const getTutorClasses = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ user: req.user._id });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const classes = await Class.find({ tutor: tutor._id }).populate('students');

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getTutorClasses };