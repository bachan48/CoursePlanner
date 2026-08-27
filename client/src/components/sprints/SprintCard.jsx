import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDeliverables } from '../../hooks';
import { formatDateDisplay } from '../../utils/formatters';
import DeliverableForm from '../deliverables/DeliverableForm';

const SprintCard = ({ sprint, courseId, onDelete }) => {
  const { deliverables, loading, createDeliverable, updateDeliverable, deleteDeliverable } = useDeliverables({ sprint: sprint._id });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      if (editing) {
        await updateDeliverable(editing._id, formData);
        toast.success('Deliverable updated');
      } else {
        await createDeliverable({ ...formData, sprint: sprint._id, course: courseId });
        toast.success('Deliverable added');
      }
      setShowForm(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save deliverable');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deliverable?')) return;
    try {
      await deleteDeliverable(id);
      toast.success('Deliverable deleted');
    } catch {
      toast.error('Failed to delete deliverable');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{sprint.name}</h3>
          {sprint.description && <p className="text-sm text-slate-600 mt-1">{sprint.description}</p>}
        </div>
        <button
          onClick={() => onDelete(sprint._id)}
          className="text-slate-400 hover:text-red-600 text-sm"
          title="Delete sprint"
        >
          Delete
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-700">Deliverables</h4>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + Add
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : deliverables.length === 0 ? (
          <p className="text-sm text-slate-400">No deliverables yet.</p>
        ) : (
          <ul className="space-y-2">
            {deliverables.map((d) => (
              <li key={d._id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">Due {formatDateDisplay(d.dueDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(d); setShowForm(true); }}
                    className="text-xs text-slate-500 hover:text-primary-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Deliverable' : 'Add Deliverable'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <DeliverableForm
                initialData={editing || {}}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintCard;
