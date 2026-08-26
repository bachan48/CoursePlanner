const WeekTimetable = ({ scheduleItems, onSlotClick }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00',
  ];

  const getTimeIndex = (time) => {
    if (!time) return 0;
    const hour = parseInt(time.split(':')[0], 10);
    return Math.max(0, Math.min(hour - 8, timeSlots.length - 1));
  };

  const calculateHeight = (startTime, endTime) => {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const startMin = parseInt(startTime.split(':')[1], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const endMin = parseInt(endTime.split(':')[1], 10);
    
    const startMinutes = startHour * 60 + startMin - 8 * 60;
    const endMinutes = endHour * 60 + endMin - 8 * 60;
    const duration = endMinutes - startMinutes;
    
    return (duration / 60) * 48;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-px bg-slate-200 border border-slate-200 rounded-t-lg">
          <div className="bg-slate-50 p-3 text-center font-semibold text-slate-700 text-sm">
            Time
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="bg-slate-50 p-3 text-center font-semibold text-slate-700 text-sm"
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-lg">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={time}
              className="grid grid-cols-8 gap-px border-b border-slate-100 min-h-[48px]"
            >
              {/* Time Label */}
              <div className="bg-slate-50 p-2 text-center text-xs text-slate-500 font-medium border-r border-slate-200">
                {(() => {
                  const date = new Date(`2000-01-01T${time}`);
                  return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                })()}
              </div>

              {/* Day Cells */}
              {days.map((day) => {
                const items = scheduleItems.filter(
                  (item) =>
                    item.day === day &&
                    getTimeIndex(item.startTime) <= timeIndex
                );

                const visibleItems = items
                  .filter((item) => getTimeIndex(item.startTime) === timeIndex)
                  .slice(0, 1);

                return (
                  <div
                    key={`${day}-${time}`}
                    className="relative p-1 border-r border-slate-100 last:border-r-0"
                    onClick={() => onSlotClick?.(day, time)}
                  >
                    {visibleItems.map((item) => {
                      const topOffset = calculateHeight(
                        item.startTime,
                        item.startTime
                      );
                      const height = calculateHeight(
                        item.startTime,
                        item.endTime
                      );

                      return (
                        <div
                          key={item._id}
                          className="absolute left-1 right-1 bg-indigo-100 border-l-4 border-indigo-500 rounded p-2 text-xs cursor-pointer hover:bg-indigo-200 transition-colors"
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.min(height, 96)}px`,
                          }}
                          title={`${item.course?.name || item.course?.code}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <p className="font-semibold truncate">
                            {item.course?.code || item.course?.name}
                          </p>
                          <p className="text-slate-600 truncate">
                            {item.type || 'Lecture'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            Legend
          </h4>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-100 border-l-2 border-indigo-500 rounded"></div>
              <span>Scheduled Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded"></div>
              <span>Available Slot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekTimetable;