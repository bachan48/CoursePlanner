import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useCourses } from '../hooks';
import CourseCard from '../components/courses/CourseCard';
import CourseForm from '../components/courses/CourseForm';
import toast from 'react-hot-toast';

const Courses = () => {
  const { courses, loading, createCourse, updateCourse, deleteCourse } = useCourses();
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleCreate = async (formData) => {
    try {
      await createCourse(formData);
      setShowModal(false);
      toast.success('Course created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateCourse(editingCourse._id, formData);
      setShowModal(false);
      setEditingCourse(null);
      toast.success('Course updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course');
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
        toast.success('Course deleted successfully!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete course');
      }
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-600 mt-1">Manage your courses</p>
          </div>
          <button onClick={() => { setEditingCourse(null); setShowModal(true); }} className="btn-primary">Add Course</button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses yet</h3>
            <p className="text-slate-600 mb-6">Get started by adding your first course</p>
            <button onClick={() => { setEditingCourse(null); setShowModal(true); }} className="btn-primary">Add Your First Course</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="relative group">
                <CourseCard course={course} onDelete={handleDelete} />
                <button
                  onClick={() => openEditModal(course)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-md p-1.5 hover:bg-slate-50"
                  title="Edit course"
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingCourse(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <CourseForm
                initialData={editingCourse || {}}
                onSubmit={editingCourse ? handleUpdate : handleCreate}
                onCancel={() => { setShowModal(false); setEditingCourse(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Courses;