import Deliverable from '../models/Deliverable.js';

// @desc    Get all deliverables for a user
// @route   GET /api/deliverables
// @access  Private
export const getDeliverables = async (req, res) => {
  try {
    const { courseId, upcoming, completed, sortBy } = req.query;
    const query = { user: req.user.id, isDeleted: false };

    if (courseId) {
      query.course = courseId;
    }

    if (upcoming === 'true') {
      query.dueDate = { $gte: new Date() };
      query.isCompleted = false;
    }

    if (completed === 'true') {
      query.isCompleted = true;
    } else if (completed === 'false') {
      query.isCompleted = false;
    }

    const sortOptions = {};
    if (sortBy === 'dueDate') {
      sortOptions.dueDate = 1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = -1;
    } else {
      sortOptions.dueDate = 1;
    }

    const deliverables = await Deliverable.find(query)
      .sort(sortOptions)
      .populate('course', 'title code color')
      .select('-__v');

    res.json({
      success: true,
      count: deliverables.length,
      data: deliverables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliverables',
      error: error.message,
    });
  }
};

// @desc    Get single deliverable
// @route   GET /api/deliverables/:id
// @access  Private
export const getDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    })
      .populate('course', 'title code color instructor')
      .select('-__v');

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found',
      });
    }

    res.json({
      success: true,
      data: deliverable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching deliverable',
      error: error.message,
    });
  }
};

// @desc    Create new deliverable
// @route   POST /api/deliverables
// @access  Private
export const createDeliverable = async (req, res) => {
  try {
    // Verify course belongs to user
    const courseModel = (await import('../models/Course.js')).default;
    const course = await courseModel.findOne({
      _id: req.body.course,
      user: req.user.id,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const deliverable = await Deliverable.create({
      ...req.body,
      user: req.user.id,
    });

    // Populate course info for response
    const populatedDeliverable = await Deliverable.findById(deliverable._id)
      .populate('course', 'title code color')
      .select('-__v');

    res.status(201).json({
      success: true,
      data: populatedDeliverable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating deliverable',
      error: error.message,
    });
  }
};

// @desc    Update deliverable
// @route   PUT /api/deliverables/:id
// @access  Private
export const updateDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found',
      });
    }

    const updatedDeliverable = await Deliverable.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('course', 'title code color')
      .select('-__v');

    res.json({
      success: true,
      data: updatedDeliverable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating deliverable',
      error: error.message,
    });
  }
};

// @desc    Delete deliverable (soft delete)
// @route   DELETE /api/deliverables/:id
// @access  Private
export const deleteDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found',
      });
    }

    deliverable.isDeleted = true;
    await deliverable.save();

    res.json({
      success: true,
      message: 'Deliverable deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting deliverable',
      error: error.message,
    });
  }
};

// @desc    Get upcoming deliverables
// @route   GET /api/deliverables/upcoming
// @access  Private
export const getUpcomingDeliverables = async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysAhead);

    const deliverables = await Deliverable.find({
      user: req.user.id,
      isDeleted: false,
      isCompleted: false,
      dueDate: { $gte: startDate, $lte: endDate },
    })
      .sort({ dueDate: 1 })
      .populate('course', 'title code color')
      .select('-__v')
      .limit(10);

    res.json({
      success: true,
      count: deliverables.length,
      data: deliverables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming deliverables',
      error: error.message,
    });
  }
};