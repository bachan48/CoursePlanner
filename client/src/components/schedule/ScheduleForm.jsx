import { useState, useEffect } from 'react';
import { courseAPI, scheduleAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ScheduleForm = ({ courseId: initialCourseId, onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    courseId: initialCourseId || '',
    day: '',
    startTime: '09:00',
    endTime: '10:30',
    type: 'Lecture',
    location: '',
  });
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAll();
        setCourses(response.data || []);
        if (initialCourseId && response.data?.length > 0) {
          setFormData((prev) => ({ ...prev, courseId: initialCourseId }));
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    fetchCourses();
  }, [initialCourseId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        courseId: initialData.courseId || '',
        day: initialData.day || '',
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '10:30',
        type: initialData.type || 'Lecture',
        location: initialData.location || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.courseId) newErrors.courseId = 'Please select a course';
    if (!formData.day) newErrors.day = 'Please select a day';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (!formData.type) newErrors.type = 'Please select a type';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }
    setIsLoading(true);
    try {
      const response = await scheduleAPI.create({
        courseId: formData.courseId,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        location: formData.location || undefined,
      });
      toast.success(initialData ? 'Schedule updated successfully' : 'Schedule created successfully');
      onSubmit(response.data);
      if (!initialData && onCancel) {
        setFormData({ courseId: '', day: '', startTime: '09:00', endTime: '10:30', type: 'Lecture', location: '' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save schedule';
      toast.error(message);
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
    } finally {
      setIsLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const typeOptions = ['Lecture', 'Tutorial', 'Laboratory', 'Seminar', 'Workshop'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
        <select
          name="courseId"
          value={formData.courseId}
          onChange={handleChange}
          className={w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 }
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>{course.code} - {course.name}</option>
          ))}
        </select>
        {errors.courseId && <p className="mt-1 text-sm text-rose-600">{errors.courseId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Day *</label>
        <select
          name="day"
          value={formData.day}
          onChange={handleChange}
          className={w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 }
        >
          <option value="">Select a day</option>
          {days.map((day) => (<option key={day} value={day}>{day}</option>))}
        </select>
        {errors.day && <p className="mt-1 text-sm text-rose-600">{errors.day}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 }
          />
          {errors.startTime && <p className="mt-1 text-sm text-rose-600">{errors.startTime}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 }
          />
          {errors.endTime && <p className="mt-1 text-sm text-rose-600">{errors.endTime}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 }
        >
          {typeOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
        </select>
        {errors.type && <p className="mt-1 text-sm text-rose-600">{errors.type}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Room 101, Building A"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
