import Course from '../models/Course.js';

// @desc    Get all courses for a user
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req, res) => {
  try {
    const { semester, search } = req.query;
    const query = { user: req.user.id, isDeleted: false };

    if (semester) {
      query.semester = semester;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: error.message,
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    }).select('-__v');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: error.message,
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private
export const createCourse = async (req, res) => {
  try {
    // Check for duplicate course code for this user
    const existingCourse = await Course.findOne({
      user: req.user.id,
      code: req.body.code.toUpperCase(),
      isDeleted: false,
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'A course with this code already exists',
      });
    }

    const course = await Course.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: error.message,
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // If code is being changed, check for duplicates
    if (req.body.code && req.body.code !== course.code) {
      const existingCourse = await Course.findOne({
        user: req.user.id,
        code: req.body.code.toUpperCase(),
        isDeleted: false,
        _id: { $ne: req.params.id },
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'A course with this code already exists',
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(req.body.code && { code: req.body.code.toUpperCase() }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-__v');

    res.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: error.message,
    });
  }
};

// @desc    Delete course (soft delete)
// @route   DELETE /api/courses/:id
// @access  Private
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    course.isDeleted = true;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: error.message,
    });
  }
};

// @desc    Get course stats
// @route   GET /api/courses/stats
// @access  Private
export const getCourseStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({
      user: req.user.id,
      isDeleted: false,
    });

    const totalCredits = await Course.aggregate([
      { $match: { user: req.user.id, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$credits' } } },
    ]);

    const coursesBySemester = await Course.aggregate([
      { $match: { user: req.user.id, isDeleted: false, semester: { $ne: '', $exists: true } } },
      { $group: { _id: '$semester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalCourses,
        totalCredits: totalCredits[0]?.total || 0,
        coursesBySemester,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course stats',
      error: error.message,
    });
  }
};