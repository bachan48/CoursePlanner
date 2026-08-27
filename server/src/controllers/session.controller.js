import Session from '../models/Session.js';
import Week from '../models/Week.js';
import Course from '../models/Course.js';

// @desc    Get sessions for a course (optionally scoped to one week)
// @route   GET /api/sessions?course=&week=
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const { course, week } = req.query;
    const query = { user: req.user.id };
    if (course) query.course = course;
    if (week) query.week = week;

    const sessions = await Session.find(query).sort({ date: 1, startTime: 1 }).select('-__v');
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions',
      error: error.message,
    });
  }
};

// @desc    Manually create a one-off session (not tied to a recurring rule)
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, user: req.user.id, isDeleted: false });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const week = await Week.findOne({ _id: req.body.week, course: req.body.course, user: req.user.id });
    if (!week) {
      return res.status(404).json({ success: false, message: 'Week not found for this course' });
    }

    const session = await Session.create({ ...req.body, classSchedule: null, user: req.user.id });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating session',
      error: error.message,
    });
  }
};

// @desc    Update a single session occurrence (speaker, reading, cancel, overrides)
// @route   PUT /api/sessions/:id
// @access  Private
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const updated = await Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-__v');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating session',
      error: error.message,
    });
  }
};

// @desc    Delete a single session occurrence
// @route   DELETE /api/sessions/:id
// @access  Private
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting session',
      error: error.message,
    });
  }
};
