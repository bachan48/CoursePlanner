import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import ClassSchedule from '../models/ClassSchedule.js';
import Session from '../models/Session.js';
import Week from '../models/Week.js';
import Sprint from '../models/Sprint.js';
import Deliverable from '../models/Deliverable.js';
import { regenerateWeeksAndSessionsForCourse } from '../utils/scheduleGenerator.js';

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
      .populate('semester', 'name startDate endDate')
      .select('-__v');

    res.json({ success: true, count: courses.length, data: courses });
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
    })
      .populate('semester', 'name startDate endDate')
      .select('-__v');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
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
    const semester = await Semester.findOne({
      _id: req.body.semester,
      user: req.user.id,
      isDeleted: false,
    });

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

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

    const populated = await Course.findById(course._id)
      .populate('semester', 'name startDate endDate')
      .select('-__v');

    res.status(201).json({ success: true, data: populated });
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
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.body.semester) {
      const semester = await Semester.findOne({
        _id: req.body.semester,
        user: req.user.id,
        isDeleted: false,
      });
      if (!semester) {
        return res.status(404).json({ success: false, message: 'Semester not found' });
      }
    }

    if (req.body.code && req.body.code.toUpperCase() !== course.code) {
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
      { new: true, runValidators: true }
    )
      .populate('semester', 'name startDate endDate')
      .select('-__v');

    res.json({ success: true, data: updatedCourse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: error.message,
    });
  }
};

// @desc    Rebuild a course's Weeks + Sessions from its current semester
//          dates and existing class-time rules. For courses whose weeks were
//          generated by an older version of the week-generation logic (or
//          are otherwise out of sync) - destructive to per-week sprint
//          assignments/notes and per-session manual edits.
// @route   POST /api/courses/:id/regenerate-weeks
// @access  Private
export const regenerateWeeks = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const semester = await Semester.findOne({
      _id: course.semester,
      user: req.user.id,
      isDeleted: false,
    });

    if (!semester) {
      return res.status(400).json({ success: false, message: 'Course has no valid semester' });
    }

    await regenerateWeeksAndSessionsForCourse({
      userId: req.user.id,
      courseId: course._id,
      semester,
      defaultSpeaker: course.instructor,
    });

    res.json({ success: true, message: 'Weeks and sessions regenerated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while regenerating weeks',
      error: error.message,
    });
  }
};

// @desc    Delete course (soft delete + cascade-delete curriculum content)
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
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const filter = { course: req.params.id, user: req.user.id };
    await Promise.all([
      Session.deleteMany(filter),
      ClassSchedule.deleteMany(filter),
      Deliverable.deleteMany(filter),
      Sprint.deleteMany(filter),
      Week.deleteMany(filter),
    ]);

    course.isDeleted = true;
    await course.save();

    res.json({ success: true, message: 'Course and all related curriculum content deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: error.message,
    });
  }
};
