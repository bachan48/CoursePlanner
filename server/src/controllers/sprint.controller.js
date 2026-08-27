import Sprint from '../models/Sprint.js';
import Week from '../models/Week.js';
import Deliverable from '../models/Deliverable.js';
import Course from '../models/Course.js';

// @desc    Get sprints for a course
// @route   GET /api/sprints?course=
// @access  Private
export const getSprints = async (req, res) => {
  try {
    const { course } = req.query;
    const query = { user: req.user.id };
    if (course) query.course = course;

    const sprints = await Sprint.find(query).sort({ createdAt: 1 }).select('-__v');
    res.json({ success: true, count: sprints.length, data: sprints });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sprints',
      error: error.message,
    });
  }
};

// @desc    Create a sprint
// @route   POST /api/sprints
// @access  Private
export const createSprint = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, user: req.user.id, isDeleted: false });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const sprint = await Sprint.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating sprint',
      error: error.message,
    });
  }
};

// @desc    Update a sprint
// @route   PUT /api/sprints/:id
// @access  Private
export const updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.id, user: req.user.id });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    const updated = await Sprint.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating sprint',
      error: error.message,
    });
  }
};

// @desc    Delete a sprint (unassigns it from weeks, deletes its deliverables)
// @route   DELETE /api/sprints/:id
// @access  Private
export const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.id, user: req.user.id });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }

    await Promise.all([
      Week.updateMany({ sprint: sprint._id, user: req.user.id }, { $set: { sprint: null } }),
      Deliverable.deleteMany({ sprint: sprint._id, user: req.user.id }),
    ]);

    await sprint.deleteOne();

    res.json({ success: true, message: 'Sprint deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting sprint',
      error: error.message,
    });
  }
};
