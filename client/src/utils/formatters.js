import { format, parseISO } from 'date-fns';

// Calendar-date fields from the API (semester/week start-end, session date,
// deliverable dueDate) are stored as UTC midnight - they represent a day, not
// an exact instant. Reading them with local-time getters (what date-fns'
// `format` does) shifts the displayed day back by one for any viewer whose
// timezone is behind UTC. This re-bases the UTC Y/M/D onto a local midnight
// Date so formatting/getters always agree with the calendar date on record.
const toCalendarDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

// Format date to readable string
export const formatDate = (date, dateFormat = 'PPP') => {
  if (!date) return 'N/A';
  try {
    return format(toCalendarDate(date), dateFormat);
  } catch (error) {
    return 'Invalid date';
  }
};

// Format date for display (e.g., "Jan 15, 2024")
export const formatDateDisplay = (date) => {
  return formatDate(date, 'MMM dd, yyyy');
};

// Format time for display (e.g., "2:30 PM")
export const formatTimeDisplay = (time) => {
  if (!time) return 'N/A';
  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  } catch (error) {
    return time;
  }
};

// Get day name from number (0 = Sunday, 1 = Monday, etc.)
export const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
};

// Day-of-week (0=Sunday..6=Saturday) for a UTC-midnight calendar-date field.
// Use instead of `new Date(value).getDay()`, which reads the local-time day
// and can be off by one for viewers behind UTC.
export const getCalendarDayOfWeek = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.getUTCDay();
};
