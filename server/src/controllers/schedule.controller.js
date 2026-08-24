import Schedule from '../models/Schedule.js';

// @desc    Get all schedule items for a user
// @route   GET /api/schedule
// @access  Private
export const getSchedule = async (req, res) => {
  try {
    const { day } = req.query;
    const query = { user: req.user.id, isDeleted: false };

    if (day) {
      query.day = day;
    }

    const schedules = await Schedule.find(query)
      .sort({ day: 1, startTime: 1 })
      .populate('course', 'title code color')
      .select('-__v');

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule',
      error: error.message,
    });
  }
};

// @desc    Get single schedule item
// @route   GET /api/schedule/:id
// @access  Private
export const getScheduleItem = async (req, res) => {
  try {
    const scheduleItem = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    })
      .populate('course', 'title code color instructor')
      .select('-__v');

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found',
      });
    }

    res.json({
      success: true,
      data: scheduleItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule item',
      error: error.message,
    });
  }
};

// @desc    Create new schedule item
// @route   POST /api/schedule
// @access  Private
export const createScheduleItem = async (req, res) => {
  try {
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

    const conflict = await Schedule.findOne({
      user: req.user.id,
      day: req.body.day,
      isDeleted: false,
      $or: [
        {
          startTime: { $lt: req.body.endTime },
          endTime: { $gt: req.body.startTime },
        },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Time conflict with ${conflict.course?.title || 'existing schedule item'}`,
      });
    }

    const scheduleItem = await Schedule.create({
      ...req.body,
      user: req.user.id,
    });

    const populatedItem = await Schedule.findById(scheduleItem._id)
      .populate('course', 'title code color')
      .select('-__v');

    res.status(201).json({
      success: true,
      data: populatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating schedule item',
      error: error.message,
    });
  }
};

// @desc    Update schedule item
// @route   PUT /api/schedule/:id
// @access  Private
export const updateScheduleItem = async (req, res) => {
  try {
    const scheduleItem = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found',
      });
    }

    if (req.body.day || req.body.startTime || req.body.endTime) {
      const conflict = await Schedule.findOne({
        user: req.user.id,
        day: req.body.day || scheduleItem.day,
        isDeleted: false,
        _id: { $ne: req.params.id },
        $or: [
          {
            startTime: { $lt: req.body.endTime || scheduleItem.endTime },
            endTime: { $gt: req.body.startTime || scheduleItem.startTime },
          },
        ],
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Time conflict with ${conflict.course?.title || 'existing schedule item'}`,
        });
      }
    }

    const updatedItem = await Schedule.findByIdAndUpdate(
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
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating schedule item',
      error: error.message,
    });
  }
};

// @desc    Delete schedule item
// @route   DELETE /api/schedule/:id
// @access  Private
export const deleteScheduleItem = async (req, res) => {
  try {
    const scheduleItem = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!scheduleItem) {
      return res.status(404).json({
        success: false,
        message: 'Schedule item not found',
      });
    }

    scheduleItem.isDeleted = true;
    await scheduleItem.save();

    res.json({
      success: true,
      message: 'Schedule item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting schedule item',
      error: error.message,
    });
  }
};

// @desc    Get weekly schedule
// @route   GET /api/schedule/weekly
// @access  Private
export const getWeeklySchedule = async (req, res) => {
  try {
    const scheduleItems = await Schedule.find({
      user: req.user.id,
      isDeleted: false,
    })
      .sort({ day: 1, startTime: 1 })
      .populate('course', 'title code color instructor');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySchedule = {};

    days.forEach((day) => {
      weeklySchedule[day] = scheduleItems.filter((item) => item.day === day);
    });

    res.json({
      success: true,
      data: weeklySchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching weekly schedule',
      error: error.message,
    });
  }
};