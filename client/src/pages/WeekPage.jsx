import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useWeeks, useWeekDetail } from '../hooks';
import { sessionAPI, courseAPI } from '../services/api';
import SessionForm from '../components/sessions/SessionForm';
import { formatDateDisplay, formatTimeDisplay, getDayName, getCalendarDayOfWeek } from '../utils/formatters';

const WeekPage = () => {
  const { courseId, weekNumber } = useParams();
  const navigate = useNavigate();
  const weekNumberInt = parseInt(weekNumber, 10);

  const [course, setCourse] = useState(null);
  const { weeks } = useWeeks(courseId);
  const currentWeekMeta = weeks.find((w) => w.weekNumber === weekNumberInt);
  const weekId = currentWeekMeta?._id;

  const { week, sessions, deliverables, loading, fetchWeek, updateWeek } = useWeekDetail(weekId);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    courseAPI.getById(courseId).then((res) => setCourse(res.data.data)).catch(() => {});
  }, [courseId]);

  useEffect(() => {
    setNotes(week?.notes || '');
  }, [week]);

  const maxWeekNumber = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) : 1;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateWeek({ notes });
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSessionSubmit = async (formData) => {
    try {
      if (editingSession) {
        await sessionAPI.update(editingSession._id, formData);
        toast.success('Session updated');
      } else {
        await sessionAPI.create({ ...formData, course: courseId, week: weekId });
        toast.success('Session added');
      }
      setShowSessionForm(false);
      setEditingSession(null);
      await fetchWeek();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await sessionAPI.delete(sessionId);
      toast.success('Session deleted');
      await fetchWeek();
    } catch {
      toast.error('Failed to delete session');
    }
  };

  if (!weekId && weeks.length > 0) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Week not found.</p>
          <Link to={`/courses/${courseId}`} className="text-primary-600 hover:underline mt-4 inline-block">Back to Course</Link>
        </div>
      </MainLayout>
    );
  }

  if (loading || !week) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to={`/courses/${courseId}`} className="text-sm text-primary-600 hover:underline">
            ← {course?.code || 'Back to course'}
          </Link>
          {weeks.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="jump-to-week" className="text-sm text-slate-500">Jump to:</label>
              <select
                id="jump-to-week"
                value={weekNumberInt}
                onChange={(e) => navigate(`/courses/${courseId}/weeks/${e.target.value}`)}
                className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {weeks.map((w) => (
                  <option key={w._id} value={w.weekNumber}>
                    Week {w.weekNumber} ({formatDateDisplay(w.startDate)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <button
            onClick={() => navigate(`/courses/${courseId}/weeks/${weekNumberInt - 1}`)}
            disabled={weekNumberInt <= 1}
            className="px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Week {week.weekNumber}</h1>
            <p className="text-sm text-slate-500">
              {formatDateDisplay(week.startDate)} – {formatDateDisplay(week.endDate)}
            </p>
            <p className="text-sm mt-1">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                {week.sprint?.name || 'No sprint assigned'}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/courses/${courseId}/weeks/${weekNumberInt + 1}`)}
            disabled={weekNumberInt >= maxWeekNumber}
            className="px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Class Sessions</h2>
            <button onClick={() => { setEditingSession(null); setShowSessionForm(true); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Add Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-slate-500">No sessions scheduled this week.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className={`border rounded-lg p-4 ${session.isCancelled ? 'bg-slate-50 border-slate-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium capitalize">
                          {session.type}
                        </span>
                        {session.isCancelled && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            No Class
                          </span>
                        )}
                      </div>
                      <p className={`font-medium ${session.isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {getDayName(getCalendarDayOfWeek(session.date))}, {formatDateDisplay(session.date)} • {formatTimeDisplay(session.startTime)} – {formatTimeDisplay(session.endTime)}
                      </p>
                      {session.location && <p className="text-sm text-slate-500 mt-0.5">{session.location}</p>}
                      {session.speaker && <p className="text-sm text-slate-600 mt-1">Speaker: {session.speaker}</p>}
                      {session.readingMaterials?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reading</p>
                          <ul className="list-disc list-inside text-sm text-slate-600">
                            {session.readingMaterials.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                      {session.activities?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Activities</p>
                          <ul className="list-disc list-inside text-sm text-slate-600">
                            {session.activities.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingSession(session); setShowSessionForm(true); }} className="text-xs text-slate-500 hover:text-primary-600">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteSession(session._id)} className="text-xs text-slate-500 hover:text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Deliverables Due</h2>
          {deliverables.length === 0 ? (
            <p className="text-slate-500">
              {week.sprint ? 'No deliverables for this sprint.' : 'Assign this week to a sprint to see its deliverables.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {deliverables.map((d) => (
                <li key={d._id} className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="font-medium text-slate-900">{d.title}</p>
                  <p className="text-sm text-slate-500">Due {formatDateDisplay(d.dueDate)}</p>
                  {d.description && <p className="text-sm text-slate-600 mt-1">{d.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Collaboration details, follow-ups, or other notes for this week..."
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>

      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingSession ? 'Edit Session' : 'Add Session'}</h2>
              <button onClick={() => { setShowSessionForm(false); setEditingSession(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <SessionForm
                initialData={editingSession || {}}
                onSubmit={handleSessionSubmit}
                onCancel={() => { setShowSessionForm(false); setEditingSession(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default WeekPage;
