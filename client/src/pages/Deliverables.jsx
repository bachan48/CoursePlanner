import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useDeliverables, useCourses } from '../hooks';
import DeliverableForm from '../components/deliverables/DeliverableForm';
import toast from 'react-hot-toast';

const typeColors = {
  assignment: 'bg-blue-100 text-blue-700',
  quiz: 'bg-purple-100 text-purple-700',
  exam: 'bg-red-100 text-red-700',
  project: 'bg-green-100 text-green-700',
  lab: 'bg-yellow-100 text-yellow-700',
  other: 'bg-slate-100 text-slate-700',
};

const getStatus = (d) => {
  const now = new Date();
  const due = new Date(d.dueDate);
  if (d.isCompleted) return 'completed';
  if (due < now) return 'overdue';
  return 'upcoming';
};

const Deliverables = () => {
  const { deliverables, loading, fetchDeliverables, createDeliverable, updateDeliverable, deleteDeliverable } = useDeliverables();
  const { courses } = useCourses();
  const [showForm, setShowForm] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  const toggleComplete = async (d) => {
    try {
      await updateDeliverable(d._id, { isCompleted: !d.isCompleted });
      toast.success(d.isCompleted ? 'Marked as incomplete' : 'Marked as complete!');
    } catch {
      toast.error('Failed to update deliverable');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deliverable?')) {
      try {
        await deleteDeliverable(id);
        toast.success('Deliverable deleted');
      } catch {
        toast.error('Failed to delete deliverable');
      }
    }
  };

  const handleEdit = (d) => {
    setEditingDeliverable(d);
    setShowForm(true);
  };

  const filteredDeliverables = deliverables
    .filter((d) => {
      if (filter === 'all') return true;
      if (filter === 'overdue') return getStatus(d) === 'overdue';
      if (filter === 'upcoming') return getStatus(d) === 'upcoming';
      if (filter === 'completed') return d.isCompleted;
      return true;
    })
    .filter((d) => {
      if (!search) return true;
      return d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'course') {
        const cA = courses.find((c) => c._id === a.course)?.code || '';
        const cB = courses.find((c) => c._id === b.course)?.code || '';
        return cA.localeCompare(cB);
      }
      return 0;
    });

  const stats = {
    total: deliverables.length,
    completed: deliverables.filter((d) => d.isCompleted).length,
    overdue: deliverables.filter((d) => getStatus(d) === 'overdue').length,
    upcoming: deliverables.filter((d) => getStatus(d) === 'upcoming').length,
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 mt-4">Loading deliverables...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Deliverables</h1>
            <p className="text-slate-600 mt-1">Manage assignments, quizzes, exams, and projects</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingDeliverable(null); }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Deliverable
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Upcoming</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Overdue</p>
<p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="type">Sort by Type</option>
              <option value="course">Sort by Course</option>
            </select>
          </div>
        </div>

        {/* Deliverable Cards Grid */}
        {filteredDeliverables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-lg">No deliverables found</p>
            <p className="text-slate-400 mt-1">
              {search || filter !== 'all' ? 'Try adjusting your filters' : 'Click "New Deliverable" to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeliverables.map((d) => {
              const status = getStatus(d);
              const course = courses.find((c) => c._id === d.course);
              const isLate = status === 'overdue';
              return (
                <div
                  key={d._id}
                    className="bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium">
                          {d.type}
                        </span>
                        {isLate && (
                          <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                            {'\u26A0'} Overdue
                          </span>
                        )}
                        {d.isCompleted && (
                          <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                            Done
                          </span>
                        )}
                      </div>
              <h3 className="font-semibold text-slate-900">
                        {d.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => toggleComplete(d)} className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50" title="Toggle complete">{'\u2714'}</button>
                      <button onClick={() => handleEdit(d)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit">{'\u270F'}</button>
                      <button onClick={() => handleDelete(d._id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">{'\uD83D\uDDD1'}</button>
                    </div>
                  </div>
                  {course && (
                    <Link to={'/courses/' + course._id} className="inline-block mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      {course.code} - {course.title}
                    </Link>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                    <span>{new Date(d.dueDate).toLocaleDateString()}</span>
                    {d.weight > 0 && <span>Weight: {d.weight}%</span>}
                  </div>
                  {d.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{d.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDeliverable ? 'Edit Deliverable' : 'New Deliverable'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingDeliverable(null); }} className="text-slate-400 hover:text-slate-600">{'\u2715'}</button>
            </div>
            <div className="p-6">
              <DeliverableForm
                initialData={editingDeliverable || {}}
                onSubmit={async (formData) => {
                  try {
                    if (editingDeliverable) {
                      await updateDeliverable(editingDeliverable._id, formData);
                      toast.success('Deliverable updated!');
                    } else {
                      await createDeliverable(formData);
                      toast.success('Deliverable created!');
                    }
                    setShowForm(false);
                    setEditingDeliverable(null);
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to save deliverable');
                  }
                }}
                onCancel={() => { setShowForm(false); setEditingDeliverable(null); }}
                courses={courses}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Deliverables;
