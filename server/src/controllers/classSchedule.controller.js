import ClassSchedule from '../models/ClassSchedule.js';
import Session from '../models/Session.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import { generateSessionsForClassSchedule } from '../utils/scheduleGenerator.js';

const getCourseWithSemester = async (courseId, userId) => {
  const course = await Course.findOne({ _id: courseId, user: userId, isDeleted: false });
  if (!course) return { course: null, semester: null };
  const semester = await Semester.findOne({ _id: course.semester, user: userId, isDeleted: false });
  return { course, semester };
};

// @desc    Get class schedule rules for a course
// @route   GET /api/class-schedules?course=
// @access  Private
export const getClassSchedules = async (req, res) => {
  try {
    const { course } = req.query;
    const query = { user: req.user.id };
    if (course) query.course = course;

    const classSchedules = await ClassSchedule.find(query).sort({ createdAt: 1 }).select('-__v');
    res.json({ success: true, count: classSchedules.length, data: classSchedules });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching class schedules',
      error: error.message,
    });
  }
};

// @desc    Create a recurring class schedule rule (generates Sessions + Weeks)
// @route   POST /api/class-schedules
// @access  Private
export const createClassSchedule = async (req, res) => {
  try {
    const { course, semester } = await getCourseWithSemester(req.body.course, req.user.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!semester) {
      return res.status(400).json({ success: false, message: 'Course has no valid semester' });
    }

    const classSchedule = await ClassSchedule.create({ ...req.body, user: req.user.id });

    const sessionsCreated = await generateSessionsForClassSchedule({
      userId: req.user.id,
      courseId: course._id,
      semester,
      classSchedule,
      defaultSpeaker: course.instructor,
    });

    res.status(201).json({ success: true, data: classSchedule, sessionsCreated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating class schedule',
      error: error.message,
    });
  }
};

// @desc    Update a class schedule rule (regenerates its Sessions)
// @route   PUT /api/class-schedules/:id
// @access  Private
export const updateClassSchedule = async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!classSchedule) {
      return res.status(404).json({ success: false, message: 'Class schedule not found' });
    }

    const { course, semester } = await getCourseWithSemester(classSchedule.course, req.user.id);
    if (!course || !semester) {
      return res.status(400).json({ success: false, message: 'Course or semester no longer exists' });
    }

    const updated = await ClassSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v');

    // Regenerate this rule's sessions from scratch so day/time edits stay consistent.
    await Session.deleteMany({ classSchedule: updated._id, user: req.user.id });
    const sessionsCreated = await generateSessionsForClassSchedule({
      userId: req.user.id,
      courseId: course._id,
      semester,
      classSchedule: updated,
      defaultSpeaker: course.instructor,
    });

    res.json({ success: true, data: updated, sessionsCreated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating class schedule',
      error: error.message,
    });
  }
};

// @desc    Delete a class schedule rule and its generated sessions
// @route   DELETE /api/class-schedules/:id
// @access  Private
export const deleteClassSchedule = async (req, res) => {
  try {
    const classSchedule = await ClassSchedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!classSchedule) {
      return res.status(404).json({ success: false, message: 'Class schedule not found' });
    }

    await Session.deleteMany({ classSchedule: classSchedule._id, user: req.user.id });
    await classSchedule.deleteOne();

    res.json({ success: true, message: 'Class schedule and its sessions deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting class schedule',
      error: error.message,
    });
  }
};
