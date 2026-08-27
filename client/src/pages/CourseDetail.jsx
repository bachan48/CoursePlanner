import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { courseAPI } from '../services/api';
import { useSemesters, useClassSchedules, useSprints, useWeeks } from '../hooks';
import CourseForm from '../components/courses/CourseForm';
import ClassScheduleForm from '../components/classSchedule/ClassScheduleForm';
import SprintForm from '../components/sprints/SprintForm';
import SprintCard from '../components/sprints/SprintCard';
import { formatDateDisplay, formatTimeDisplay } from '../utils/formatters';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showClassScheduleForm, setShowClassScheduleForm] = useState(false);
  const [editingClassSchedule, setEditingClassSchedule] = useState(null);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [selectedWeekIds, setSelectedWeekIds] = useState([]);
  const [assignSprintValue, setAssignSprintValue] = useState('__unchosen__');

  const { semesters } = useSemesters();
  const { classSchedules, createClassSchedule, updateClassSchedule, deleteClassSchedule } = useClassSchedules(id);
  const { sprints, createSprint, deleteSprint } = useSprints(id);
  const { weeks, assignSprint, fetchWeeks } = useWeeks(id);

  const SPRINT_COLORS = ['#4F46E5', '#0EA5E9', '#059669', '#D97706', '#DB2777', '#7C3AED'];
  const sprintColor = (sprintId) => {
    const index = sprints.findIndex((s) => s._id === sprintId);
    return index === -1 ? '#94A3B8' : SPRINT_COLORS[index % SPRINT_COLORS.length];
  };

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getById(id);
      setCourse(response.data.data);
    } catch {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleUpdateCourse = async (formData) => {
    try {
      const response = await courseAPI.update(id, formData);
      setCourse(response.data.data);
      setShowEditCourse(false);
      toast.success('Course updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course');
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Delete this course? All its class times, sprints, weeks, and deliverables will also be deleted.')) return;
    try {
      await courseAPI.delete(id);
      toast.success('Course deleted');
      navigate('/courses');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const handleClassScheduleSubmit = async (formData) => {
    try {
      if (editingClassSchedule) {
        await updateClassSchedule(editingClassSchedule._id, { ...formData, course: id });
        toast.success('Class time updated');
      } else {
        await createClassSchedule({ ...formData, course: id });
        toast.success('Class time added');
      }
      setShowClassScheduleForm(false);
      setEditingClassSchedule(null);
      await fetchWeeks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save class time');
    }
  };

  const handleDeleteClassSchedule = async (classScheduleId) => {
    if (!window.confirm('Delete this recurring class time? All its generated sessions will be removed.')) return;
    try {
      await deleteClassSchedule(classScheduleId);
      toast.success('Class time deleted');
    } catch {
      toast.error('Failed to delete class time');
    }
  };

  const handleRegenerateWeeks = async () => {
    if (!window.confirm('Rebuild this course\'s weeks and sessions from the semester\'s current dates? Sprint assignments, week notes, and manual session edits (speaker, reading, cancellations) will be lost.')) return;
    try {
      await courseAPI.regenerateWeeks(id);
      await fetchWeeks();
      toast.success('Weeks regenerated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to regenerate weeks');
    }
  };

  const handleCreateSprint = async (formData) => {
    try {
      await createSprint({ ...formData, course: id });
      setShowSprintForm(false);
      toast.success('Sprint created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create sprint');
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('Delete this sprint? Its deliverables will also be deleted and its weeks unassigned.')) return;
    try {
      await deleteSprint(sprintId);
      await fetchWeeks();
      toast.success('Sprint deleted');
    } catch {
      toast.error('Failed to delete sprint');
    }
  };

  const toggleWeekSelected = (weekId) => {
    setSelectedWeekIds((prev) =>
      prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
    );
  };

  const handleAssignSprint = async () => {
    if (selectedWeekIds.length === 0 || assignSprintValue === '__unchosen__') return;
    try {
      await assignSprint(selectedWeekIds, assignSprintValue === '__none__' ? null : assignSprintValue);
      setSelectedWeekIds([]);
      setAssignSprintValue('__unchosen__');
      toast.success('Weeks updated');
    } catch {
      toast.error('Failed to assign sprint to weeks');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Course not found.</p>
          <Link to="/courses" className="text-primary-600 hover:underline mt-4 inline-block">Back to Courses</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{course.code}</span>
                {course.semester?.name && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{course.semester.name}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">{course.title}</h1>
              <p className="text-slate-600 mt-1">{course.credits} credits{course.instructor && ` • ${course.instructor}`}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEditCourse(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              Edit Course
            </button>
            <button onClick={handleDeleteCourse} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>

        {course.description && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-slate-600 whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        {/* Class Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Class Times</h2>
            <button
              onClick={() => { setEditingClassSchedule(null); setShowClassScheduleForm(true); }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Class Time
            </button>
          </div>
          {classSchedules.length === 0 ? (
            <p className="text-slate-500">No recurring class times yet.</p>
          ) : (
            <ul className="space-y-2">
              {classSchedules.map((cs) => (
                <li key={cs._id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium mr-2 capitalize">
                      {cs.type}
                    </span>
                    <span className="text-sm text-slate-700">
                      {cs.daysOfWeek.join(', ')} • {formatTimeDisplay(cs.startTime)} – {formatTimeDisplay(cs.endTime)}
                      {cs.location && ` • ${cs.location}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setEditingClassSchedule(cs); setShowClassScheduleForm(true); }}
                      className="text-xs text-slate-500 hover:text-primary-600"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClassSchedule(cs._id)} className="text-xs text-slate-400 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>        

        {/* Weeks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Weeks Overview</h2>
              <p className="text-sm text-slate-500 mt-0.5">Click a week to open it, or check weeks below to group them into a sprint.</p>
            </div>
            {weeks.length > 0 && (
              <button
                onClick={handleRegenerateWeeks}
                className="text-sm text-slate-500 hover:text-primary-600 whitespace-nowrap"
                title="Rebuild week/session dates from the semester's current range - use this if week dates look wrong"
              >
                Regenerate Weeks
              </button>
            )}
          </div>

          {weeks.length > 0 && sprints.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-sm font-medium text-slate-700">
                {selectedWeekIds.length > 0
                  ? `${selectedWeekIds.length} week${selectedWeekIds.length > 1 ? 's' : ''} selected`
                  : 'No weeks selected'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-slate-600">Assign to sprint:</label>
                <select
                  value={assignSprintValue}
                  onChange={(e) => setAssignSprintValue(e.target.value)}
                  className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="__unchosen__" disabled>Choose a sprint...</option>
                  <option value="__none__">No Sprint (unassign)</option>
                  {sprints.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignSprint}
                  disabled={selectedWeekIds.length === 0 || assignSprintValue === '__unchosen__'}
                  className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
                {selectedWeekIds.length > 0 && (
                  <button onClick={() => setSelectedWeekIds([])} className="text-sm text-slate-500 hover:text-slate-700">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {weeks.length === 0 ? (
            <p className="text-slate-500">Weeks are generated automatically once you add a class time.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {weeks.map((week) => {
                const isSelected = selectedWeekIds.includes(week._id);
                const color = week.sprint ? sprintColor(week.sprint._id) : null;
                return (
                  <div
                    key={week._id}
                    onClick={() => navigate(`/courses/${id}/weeks/${week.weekNumber}`)}
                    className={`relative cursor-pointer rounded-lg border p-3 pt-6 transition-shadow hover:shadow-md ${
                      isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-slate-200'
                    }`}
                    style={color ? { borderTopColor: color, borderTopWidth: '3px' } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleWeekSelected(week._id)}
                      className="absolute top-2 right-2"
                    />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Week {week.weekNumber}</p>
                    <p className="text-sm text-slate-900 mt-1">{formatDateDisplay(week.startDate)}</p>
                    <p className="text-xs text-slate-400">– {formatDateDisplay(week.endDate)}</p>
                    {week.sprint ? (
                      <span
                        className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium text-white truncate max-w-full"
                        style={{ backgroundColor: color }}
                      >
                        {week.sprint.name}
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-xs text-slate-400">No sprint</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sprints */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Sprints</h2>
            <button onClick={() => setShowSprintForm(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              + New Sprint
            </button>
          </div>
          {sprints.length === 0 ? (
            <p className="text-slate-500">No sprints yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sprints.map((sprint) => (
                <SprintCard key={sprint._id} sprint={sprint} courseId={id} onDelete={handleDeleteSprint} />
              ))}
            </div>
          )}
        </div>
        
      </div>

      {showEditCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Course</h2>
              <button onClick={() => setShowEditCourse(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <CourseForm initialData={course} semesters={semesters} onSubmit={handleUpdateCourse} onCancel={() => setShowEditCourse(false)} />
            </div>
          </div>
        </div>
      )}

      {showClassScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingClassSchedule ? 'Edit Class Time' : 'Add Class Time'}</h2>
              <button
                onClick={() => { setShowClassScheduleForm(false); setEditingClassSchedule(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ClassScheduleForm
                initialData={editingClassSchedule || {}}
                onSubmit={handleClassScheduleSubmit}
                onCancel={() => { setShowClassScheduleForm(false); setEditingClassSchedule(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {showSprintForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">New Sprint</h2>
              <button onClick={() => setShowSprintForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <SprintForm onSubmit={handleCreateSprint} onCancel={() => setShowSprintForm(false)} />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CourseDetail;
