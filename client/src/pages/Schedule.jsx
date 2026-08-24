import { useState } from 'react';
import { format } from 'date-fns';
import MainLayout from '../components/layout/MainLayout';
import ScheduleItem from '../components/schedule/ScheduleItem';
import { useSchedule, useCourses } from '../hooks';
import toast from 'react-hot-toast';

const Schedule = () => {
  const { scheduleItems, loading, createScheduleItem, updateScheduleItem, deleteScheduleItem } = useSchedule();
  const { courses } = useCourses();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const handleCreate = async (formData) => {
    try {
      await createScheduleItem(formData);
      setShowModal(false);
      toast.success('Schedule item created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create schedule item');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateScheduleItem(editingItem._id, formData);
      setShowModal(false);
      setEditingItem(null);
      toast.success('Schedule item updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update schedule item');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this schedule item?')) {
      try {
        await deleteScheduleItem(itemId);
        toast.success('Schedule item deleted successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete schedule item');
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const getItemsForSlot = (day, time) => {
    const dayOfWeek = days.indexOf(day);
    return scheduleItems.filter((item) => {
      const itemDay = new Date(item.day).getDay();
      const itemHour = parseInt(item.startTime?.split(':')[0]) || 0;
      return itemDay === dayOfWeek && itemHour === parseInt(time);
    });
  };

  const formatDate = (date) => format(date, 'MMM d');
  const weekDays = () => {
    const d = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeekStart);
      date.setDate(date.getDate() + i);
      d.push(date);
    }
    return d;
  };
  const wd = weekDays();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Weekly Schedule</h1>
            <p className="text-slate-600 mt-1">Organize your courses on a weekly timetable</p>
          </div>
          <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="btn-primary">Add Event</button>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <button onClick={() => { const n = new Date(selectedWeekStart); n.setDate(n.getDate() - 7); setSelectedWeekStart(n); }} className="p-2 hover:bg-slate-100 rounded-lg">â†</button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900">{formatDate(wd[0])} - {formatDate(wd[6])}</h2>
            <p className="text-sm text-slate-500">{format(new Date(), 'MMMM yyyy')}</p>
          </div>
          <button onClick={() => { const n = new Date(selectedWeekStart); n.setDate(n.getDate() + 7); setSelectedWeekStart(n); }} className="p-2 hover:bg-slate-100 rounded-lg">â†’</button>
          <button onClick={() => { const t = new Date(); const d = t.getDay(); const diff = t.getDate() - d + (d === 0 ? -6 : 1); setSelectedWeekStart(new Date(t.setDate(diff))); }} className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium">Today</button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading schedule...</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-3 text-left text-sm font-semibold text-slate-600 w-20">Time</th>
                  {wd.map((date, index) => (
                    <th key={index} className="py-3 px-2 text-center text-sm font-semibold text-slate-600">
                      <div>{days[index]}</div>
                      <div className="text-xs mt-1">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-sm font-medium text-slate-600 whitespace-nowrap">{format(new Date(`2000-01-01T${time}`), 'h:mm a')}</td>
                    {days.map((day) => {
                      const items = getItemsForSlot(day, time);
                      return (
                        <td key={`${day}-${time}`} className="py-2 px-2 align-top">
                          {items.map((item) => (
                            <div key={item._id} className="rounded-lg p-2 mb-1 cursor-pointer hover:shadow-md transition-shadow group relative" style={{ backgroundColor: `${item.color || '#3b82f6'}20`, borderLeft: `3px solid ${item.color || '#3b82f6'}` }} onClick={() => openEditModal(item)}>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item._id); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs" title="Delete">âœ•</button>
                              <p className="text-xs font-semibold text-slate-900 truncate">{item.course?.title || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{format(new Date(item.startTime), 'h:mm a')}{item.endTime && ` - ${format(new Date(`2000-01-01T${item.endTime}`), 'h:mm a')}`}</p>
                              {item.location && <p className="text-xs text-slate-400 truncate">{item.location}</p>}
                            </div>
                          ))}
                          <button onClick={() => { setEditingItem({ day: days.indexOf(day), startTime: `${time}:00`, course: '' }); setShowModal(true); }} className="w-full py-1 text-slate-300 hover:text-primary-500 transition-colors text-lg" title="Add on">+</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {scheduleItems.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">All Schedule Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleItems
                .sort((a, b) => new Date(a.day + 'T' + a.startTime) - new Date(b.day + 'T' + b.startTime))
                .map((item) => (
                  <div key={item._id} className="relative group">
                    <ScheduleItem item={item} onDelete={handleDelete} />
                    <button
                      onClick={() => openEditModal(item)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-md shadow-sm p-1 text-xs hover:bg-slate-50"
                      title="Edit"
                    >
                      âœï¸
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingItem(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                âœ•
              </button>
            </div>
            <div className="p-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = Object.fromEntries(new FormData(e.target).entries());
                  data.day = editingItem?.day ?? 0;
                  data.color = editingItem?.color || '#3b82f6';
                  await (editingItem ? handleUpdate(formData) : handleCreate(formData));
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
                  <select
                    name="course"
                    required
                    defaultValue={editingItem?.course || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Day *</label>
                  <select
                    name="day"
                    required
                    defaultValue={editingItem?.day ?? 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {days.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      required
                      defaultValue={editingItem?.startTime || '09:00'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      required
                      defaultValue={editingItem?.endTime || '10:00'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingItem?.location || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Room 204"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue={editingItem?.type || 'lecture'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingItem(null); }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Schedule;


