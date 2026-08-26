import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseAPI, deliverableAPI, scheduleAPI } from '../services/api';
import MainLayout from '../components/layout/MainLayout';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', code: '', credits: 0, instructor: '',
    description: '', color: '#4F46E5', semester: '',
  });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, delivRes, schedRes] = await Promise.all([
        courseAPI.getById(id),
        deliverableAPI.getAll({ course: id }),
        scheduleAPI.getAll({ course: id }),
      ]);
      setCourse(courseRes.data.data);
      setFormData({
        title: courseRes.data.data.title,
        code: courseRes.data.data.code,
        credits: courseRes.data.data.credits,
        instructor: courseRes.data.data.instructor || '',
        description: courseRes.data.data.description || '',
        color: courseRes.data.data.color || '#4F46E5',
        semester: courseRes.data.data.semester || '',
      });
      setDeliverables((delivRes.data.data || []).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      setScheduleItems(schedRes.data.data || []);
    } catch {
      toast.error('Failed to load course details');
    } finally { setLoading(false); }
  };

  const toggleDeliverableComplete = async (deliverable) => {
    try {
      const response = await deliverableAPI.update(deliverable._id, { isCompleted: !deliverable.isCompleted });
      setDeliverables((prev) => prev.map((d) => (d._id === deliverable._id ? response.data.data : d)));
      toast.success(deliverable.isCompleted ? 'Marked as incomplete' : 'Marked as complete!');
    } catch { toast.error('Failed to update deliverable'); }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await courseAPI.update(id, formData);
      setCourse(response.data.data);
      setShowEditModal(false);
      toast.success('Course updated successfully!');
    } catch { toast.error('Failed to update course'); }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this course? All related deliverables and schedule items will also be deleted.')) {
      try { await courseAPI.delete(id); toast.success('Course deleted successfully'); navigate('/courses'); }
      catch { toast.error('Failed to delete course'); }
    }
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  const completedDeliverables = deliverables.filter((d) => d.isCompleted).length;
  const overdueDeliverables = deliverables.filter((d) => !d.isCompleted && isOverdue(d.dueDate));
  const upcomingDeliverables = deliverables.filter((d) => !d.isCompleted && !isOverdue(d.dueDate)).slice(0, 3);
  const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 mt-4">Loading course details...</p>
        </div>
      </MainLayout>
    );
  }
  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Course not found.</p>
          <Link to="/courses" className="text-indigo-600 hover:underline mt-4 inline-block">Back to Courses</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {course.color && <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{course.code}</span>
                {course.semester && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{course.semester}</span>}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">{course.title}</h1>
              <p className="text-slate-600 mt-1">{course.credits} credits{course.instructor && <span className="ml-2">{'\u2022'} {course.instructor}</span>}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEditModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Edit Course</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </div>
        {course.description && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-slate-600 whitespace-pre-wrap">{course.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Total Deliverables</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{deliverables.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{completedDeliverables}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Overdue</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{overdueDeliverables.length}</p>
          </div>
        </div>

        {/* Overdue Alerts */}
        {overdueDeliverables.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Overdue Tasks</h3>
            <ul className="space-y-2">
              {overdueDeliverables.map((d) => (
                <li key={d._id} className="flex items-center justify-between">
                  <span className="text-red-700 font-medium">{d.title}</span>
                  <span className="text-sm text-red-600">Due: {new Date(d.dueDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upcoming Deliverables */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deliverables</h2>
          {upcomingDeliverables.length === 0 ? (
            <p className="text-slate-500">No upcoming deliverables.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeliverables.map((d) => (
                <li key={d._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDeliverableComplete(d)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        d.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {d.isCompleted && <span className="text-white text-xs">{String.fromCharCode(10003)}</span>}
                    </button>
                    <div>
                      <p className={`font-medium ${d.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>{d.title}</p>
                      <p className="text-sm text-slate-500">Type: {d.type || 'Other'} | Due: {new Date(d.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {deliverables.length > 3 && (
            <Link to={`/deliverables?course=${id}`} className="text-indigo-600 hover:underline mt-4 inline-block">
              View all {deliverables.length} deliverables
            </Link>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Schedule</h2>
          {scheduleItems.length === 0 ? (
            <p className="text-slate-500">No schedule items for this course.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Day</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleItems.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900">{item.startTime} - {item.endTime}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                          {typeof item.day === 'string' ? item.day : daysOfWeek[item.day] || item.day}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.duration || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600">{item.location || 'TBD'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">{String.fromCharCode(10005)}</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credits *</label>
                  <input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })} min="0" max="20" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                  <input type="text" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
                <input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="4" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-10 px-1 border border-slate-300 rounded-lg cursor-pointer" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CourseDetail;
