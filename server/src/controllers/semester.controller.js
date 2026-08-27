import Semester from '../models/Semester.js';
import Course from '../models/Course.js';
import Week from '../models/Week.js';
import { regenerateWeeksAndSessionsForCourse } from '../utils/scheduleGenerator.js';

// @desc    Get all semesters for a user
// @route   GET /api/semesters
// @access  Private
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ user: req.user.id, isDeleted: false })
      .sort({ startDate: -1 })
      .select('-__v');

    res.json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching semesters',
      error: error.message,
    });
  }
};

// @desc    Get single semester
// @route   GET /api/semesters/:id
// @access  Private
export const getSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    }).select('-__v');

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    res.json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching semester',
      error: error.message,
    });
  }
};

// @desc    Create new semester
// @route   POST /api/semesters
// @access  Private
export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating semester',
      error: error.message,
    });
  }
};

// @desc    Update semester (regenerates weeks/sessions for its courses if the
//          date range changes - requires confirmRegenerate:true once courses
//          with existing weeks would be affected)
// @route   PUT /api/semesters/:id
// @access  Private
export const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const { confirmRegenerate, ...updateFields } = req.body;

    const datesChanging =
      new Date(updateFields.startDate).getTime() !== semester.startDate.getTime() ||
      new Date(updateFields.endDate).getTime() !== semester.endDate.getTime();

    const courses = await Course.find({ semester: req.params.id, user: req.user.id, isDeleted: false });

    if (datesChanging && !confirmRegenerate) {
      const affectedCourses = [];
      for (const course of courses) {
        const weekCount = await Week.countDocuments({ course: course._id, user: req.user.id });
        if (weekCount > 0) {
          affectedCourses.push({ id: course._id, title: course.title, code: course.code, weekCount });
        }
      }

      if (affectedCourses.length > 0) {
        return res.status(409).json({
          success: false,
          needsConfirmation: true,
          message: 'Changing this semester\'s dates will regenerate weeks and sessions for the courses below. Sprint assignments, week notes, and manual session edits (speaker, reading, cancellations) in those courses will be lost.',
          affectedCourses,
        });
      }
    }

    const updated = await Semester.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (datesChanging) {
      for (const course of courses) {
        await regenerateWeeksAndSessionsForCourse({
          userId: req.user.id,
          courseId: course._id,
          semester: updated,
          defaultSpeaker: course.instructor,
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating semester',
      error: error.message,
    });
  }
};

// @desc    Delete semester (soft delete)
// @route   DELETE /api/semesters/:id
// @access  Private
export const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    const courseCount = await Course.countDocuments({
      semester: req.params.id,
      isDeleted: false,
    });

    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a semester that still has courses. Delete its courses first.',
      });
    }

    semester.isDeleted = true;
    await semester.save();

    res.json({ success: true, message: 'Semester deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting semester',
      error: error.message,
    });
  }
};
