import { format } from 'date-fns';

const ScheduleItem = ({ item, onDelete }) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getTimeSlot = (time) => {
    if (!time) return '';
    const date = new Date(`2000-01-01T${time}`);
    return format(date, 'h:mm a').toLowerCase();
  };

  return (
    <div className="bg-white border-l-4 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 group relative"
      style={{ borderLeftColor: item.color || '#3b82f6' }}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(item._id);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
          title="Delete schedule item"
        >
          ✕
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{item.course?.title || 'Unknown Course'}</h4>
          <p className="text-sm text-slate-500">{item.course?.code}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <span>📅 {dayNames[new Date(item.day).getDay()]}</span>
            <span>•</span>
            <span>🕐 {getTimeSlot(item.startTime)} - {getTimeSlot(item.endTime)}</span>
          </div>
          {item.location && (
            <p className="text-sm text-slate-500 mt-1">📍 {item.location}</p>
          )}
          {item.type && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">
              {item.type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleItem;