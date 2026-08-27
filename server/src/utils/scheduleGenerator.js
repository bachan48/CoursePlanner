import Week from '../models/Week.js';
import Session from '../models/Session.js';
import ClassSchedule from '../models/ClassSchedule.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const laterOf = (a, b) => (a.getTime() > b.getTime() ? a : b);
const earlierOf = (a, b) => (a.getTime() < b.getTime() ? a : b);

// Monday of the calendar week containing `date` (may fall before `date` itself).
const getMonday = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const getFriday = (monday) => addDays(monday, 4);

// Monday of the first teaching week. Normally the Monday of the week
// containing the semester's start date - but if the semester starts on a
// Saturday/Sunday, that week's Friday already fell before the start date, so
// there's no valid Mon-Fri slice for it; in that case the first teaching
// week is the following Monday instead.
const firstTeachingMonday = (semesterStart) => {
  const monday = getMonday(semesterStart);
  const friday = getFriday(monday);
  return friday.getTime() < semesterStart.getTime() ? addDays(monday, 7) : monday;
};

// Which 1-based week number a date falls into, given the Monday of week 1.
const weekNumberForDate = (date, firstMonday) =>
  Math.round((getMonday(date).getTime() - firstMonday.getTime()) / MS_PER_WEEK) + 1;

// Ensures Week 1..N exist for a course, each spanning Monday-Friday of a
// calendar week, clipped so no week ever starts before the semester's start
// date or ends after its end date. Safe to call multiple times - only
// creates weeks that don't already exist.
export const ensureWeeksForCourse = async ({ userId, courseId, semester }) => {
  const semStart = startOfDay(semester.startDate);
  const semEnd = startOfDay(semester.endDate);
  const firstMonday = firstTeachingMonday(semStart);
  const lastMonday = getMonday(semEnd);
  const totalWeeks = Math.max(1, Math.round((lastMonday.getTime() - firstMonday.getTime()) / MS_PER_WEEK) + 1);

  const existingWeeks = await Week.find({ course: courseId }).sort({ weekNumber: 1 });
  const existingByNumber = new Map(existingWeeks.map((w) => [w.weekNumber, w]));

  const weeksToCreate = [];
  for (let weekNumber = 1; weekNumber <= totalWeeks; weekNumber += 1) {
    if (existingByNumber.has(weekNumber)) continue;

    const monday = addDays(firstMonday, (weekNumber - 1) * 7);
    const friday = getFriday(monday);
    const weekStart = laterOf(monday, semStart);
    const weekEnd = earlierOf(friday, semEnd);

    weeksToCreate.push({
      user: userId,
      course: courseId,
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
    });
  }

  if (weeksToCreate.length > 0) {
    const created = await Week.insertMany(weeksToCreate);
    created.forEach((w) => existingByNumber.set(w.weekNumber, w));
  }

  return Array.from(existingByNumber.values()).sort((a, b) => a.weekNumber - b.weekNumber);
};

// Generates one Session per matching weekday between the semester's start/end
// dates for a given recurring ClassSchedule rule.
export const generateSessionsForClassSchedule = async ({
  userId,
  courseId,
  semester,
  classSchedule,
  defaultSpeaker,
}) => {
  const weeks = await ensureWeeksForCourse({ userId, courseId, semester });
  const weeksByNumber = new Map(weeks.map((w) => [w.weekNumber, w]));
  const firstMonday = firstTeachingMonday(startOfDay(semester.startDate));

  const start = startOfDay(semester.startDate);
  const end = startOfDay(semester.endDate);
  const sessionsToCreate = [];

  // Step by calendar day via addDays (setDate-based), not by adding a fixed
  // MS_PER_DAY - a DST fall-back day has 25 real hours, so fixed-millisecond
  // stepping drifts local midnight backward by an hour from that day on,
  // making every date.getDay() after the transition read as the wrong
  // weekday (surfaced as sessions "shifting by a day" starting in November).
  for (let date = new Date(start); date.getTime() <= end.getTime(); date = addDays(date, 1)) {
    const dayName = DAY_NAMES[date.getDay()];
    if (!classSchedule.daysOfWeek.includes(dayName)) continue;

    // A date can only ever land before week 1 if the semester itself starts
    // on a weekend day the rule also meets on - fold that rare stub into
    // week 1 rather than silently dropping the session.
    const weekNumber = Math.max(1, Math.min(weekNumberForDate(date, firstMonday), weeks.length));
    const week = weeksByNumber.get(weekNumber);
    if (!week) continue;

    sessionsToCreate.push({
      user: userId,
      course: courseId,
      classSchedule: classSchedule._id,
      week: week._id,
      date,
      type: classSchedule.type,
      startTime: classSchedule.startTime,
      endTime: classSchedule.endTime,
      location: classSchedule.location,
      speaker: defaultSpeaker || '',
      readingMaterials: [],
      activities: [],
      isCancelled: false,
    });
  }

  if (sessionsToCreate.length > 0) {
    await Session.insertMany(sessionsToCreate);
  }

  return sessionsToCreate.length;
};

// Wipes and rebuilds a course's Weeks + Sessions against a new semester date
// range, replaying its existing ClassSchedule rules. Destructive: any
// per-week sprint assignment/notes and per-session manual edits are lost -
// callers must get explicit confirmation before invoking this.
export const regenerateWeeksAndSessionsForCourse = async ({ userId, courseId, semester, defaultSpeaker }) => {
  await Session.deleteMany({ course: courseId, user: userId });
  await Week.deleteMany({ course: courseId, user: userId });

  const classSchedules = await ClassSchedule.find({ course: courseId, user: userId });

  await ensureWeeksForCourse({ userId, courseId, semester });

  for (const classSchedule of classSchedules) {
    await generateSessionsForClassSchedule({
      userId,
      courseId,
      semester,
      classSchedule,
      defaultSpeaker,
    });
  }
};
