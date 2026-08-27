import { format, formatDistanceToNow, parseISO, isPast, isFuture } from 'date-fns';

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

// Format date relative to now (e.g., "2 days ago", "in 3 days")
export const formatRelativeDate = (date) => {
  if (!date) return 'N/A';
  try {
    const parsedDate = parseISO(date);
    if (isPast(parsedDate)) {
      return `${formatDistanceToNow(parsedDate)} ago`;
    }
    return `in ${formatDistanceToNow(parsedDate)}`;
  } catch (error) {
    return 'Invalid date';
  }
};

// Check if a date is overdue
export const isOverdue = (date) => {
  if (!date) return false;
  try {
    return isPast(parseISO(date));
  } catch (error) {
    return false;
  }
};

// Check if a date is in the future
export const isInFuture = (date) => {
  if (!date) return false;
  try {
    return isFuture(parseISO(date));
  } catch (error) {
    return false;
  }
};

// Format currency (for grades, weights, etc.)
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${Number(value).toFixed(1)}%`;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Get color based on priority/urgency
export const getPriorityColor = (priority) => {
  const colors = {
    high: 'text-rose-600 bg-rose-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-emerald-600 bg-emerald-50',
  };
  return colors[priority?.toLowerCase()] || colors.low;
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    pending: 'text-amber-600 bg-amber-50',
    in_progress: 'text-blue-600 bg-blue-50',
    completed: 'text-emerald-600 bg-emerald-50',
    overdue: 'text-rose-600 bg-rose-50',
    cancelled: 'text-slate-600 bg-slate-50',
  };
  return colors[status?.toLowerCase()] || colors.pending;
};

// Get day name from number (0 = Sunday, 1 = Monday, etc.)
export const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
};

// Get day number from name
export const getDayNumber = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
};

// Day-of-week (0=Sunday..6=Saturday) for a UTC-midnight calendar-date field.
// Use instead of `new Date(value).getDay()`, which reads the local-time day
// and can be off by one for viewers behind UTC.
export const getCalendarDayOfWeek = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d.getUTCDay();
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default {
  formatDate,
  formatDateDisplay,
  formatTimeDisplay,
  formatRelativeDate,
  isOverdue,
  isInFuture,
  formatCurrency,
  formatPercentage,
  truncateText,
  getPriorityColor,
  getStatusColor,
  getDayName,
  getCalendarDayOfWeek,
  getDayNumber,
  formatFileSize,
};