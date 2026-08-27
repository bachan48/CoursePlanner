import Week from '../models/Week.js';
import Session from '../models/Session.js';
import Deliverable from '../models/Deliverable.js';

// @desc    Get all weeks for a course
// @route   GET /api/weeks?course=
// @access  Private
export const getWeeks = async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ success: false, message: 'course query param is required' });
    }

    const weeks = await Week.find({ course, user: req.user.id })
      .sort({ weekNumber: 1 })
      .populate('sprint', 'name')
      .select('-__v');

    res.json({ success: true, count: weeks.length, data: weeks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching weeks',
      error: error.message,
    });
  }
};

// @desc    Get a single week with its sessions and deliverables
// @route   GET /api/weeks/:id
// @access  Private
export const getWeek = async (req, res) => {
  try {
    const week = await Week.findOne({ _id: req.params.id, user: req.user.id })
      .populate('sprint', 'name description')
      .select('-__v');

    if (!week) {
      return res.status(404).json({ success: false, message: 'Week not found' });
    }

    const sessions = await Session.find({ week: week._id, user: req.user.id })
      .sort({ date: 1, startTime: 1 })
      .select('-__v');

    const deliverables = week.sprint
      ? await Deliverable.find({ sprint: week.sprint._id, user: req.user.id })
          .sort({ dueDate: 1 })
          .select('-__v')
      : [];

    res.json({ success: true, data: { week, sessions, deliverables } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching week',
      error: error.message,
    });
  }
};

// @desc    Update a week's notes / sprint assignment
// @route   PUT /api/weeks/:id
// @access  Private
export const updateWeek = async (req, res) => {
  try {
    const week = await Week.findOne({ _id: req.params.id, user: req.user.id });
    if (!week) {
      return res.status(404).json({ success: false, message: 'Week not found' });
    }

    const updated = await Week.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('sprint', 'name')
      .select('-__v');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating week',
      error: error.message,
    });
  }
};

// @desc    Bulk-assign a sprint to a set of weeks (or clear it with sprint: null)
// @route   PUT /api/weeks/assign-sprint
// @access  Private
export const assignSprintToWeeks = async (req, res) => {
  try {
    const { weekIds, sprint } = req.body;

    const result = await Week.updateMany(
      { _id: { $in: weekIds }, user: req.user.id },
      { $set: { sprint: sprint || null } }
    );

    res.json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while assigning sprint to weeks',
      error: error.message,
    });
  }
};
