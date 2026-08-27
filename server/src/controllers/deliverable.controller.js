import Deliverable from '../models/Deliverable.js';
import Sprint from '../models/Sprint.js';

// @desc    Get deliverables (scoped by sprint or course)
// @route   GET /api/deliverables?sprint=&course=
// @access  Private
export const getDeliverables = async (req, res) => {
  try {
    const { sprint, course } = req.query;
    const query = { user: req.user.id };
    if (sprint) query.sprint = sprint;
    if (course) query.course = course;

    const deliverables = await Deliverable.find(query).sort({ dueDate: 1 }).select('-__v');
    res.json({ success: true, count: deliverables.length, data: deliverables });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliverables',
      error: error.message,
    });
  }
};

// @desc    Create a deliverable attached to a sprint
// @route   POST /api/deliverables
// @access  Private
export const createDeliverable = async (req, res) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.body.sprint, user: req.user.id });
    if (!sprint) {
      return res.status(404).json({ success: false, message: 'Sprint not found' });
    }
    if (String(sprint.course) !== String(req.body.course)) {
      return res.status(400).json({ success: false, message: 'Sprint does not belong to this course' });
    }

    const deliverable = await Deliverable.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: deliverable });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating deliverable',
      error: error.message,
    });
  }
};

// @desc    Update a deliverable
// @route   PUT /api/deliverables/:id
// @access  Private
export const updateDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findOne({ _id: req.params.id, user: req.user.id });
    if (!deliverable) {
      return res.status(404).json({ success: false, message: 'Deliverable not found' });
    }

    const updated = await Deliverable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating deliverable',
      error: error.message,
    });
  }
};

// @desc    Delete a deliverable
// @route   DELETE /api/deliverables/:id
// @access  Private
export const deleteDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findOne({ _id: req.params.id, user: req.user.id });
    if (!deliverable) {
      return res.status(404).json({ success: false, message: 'Deliverable not found' });
    }

    await deliverable.deleteOne();
    res.json({ success: true, message: 'Deliverable deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting deliverable',
      error: error.message,
    });
  }
};
