import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useSemesters, useCourses } from '../hooks';
import SemesterForm from '../components/semesters/SemesterForm';
import CourseForm from '../components/courses/CourseForm';
import { formatDateDisplay } from '../utils/formatters';

const CourseList = () => {
  const { semesters, loading: semestersLoading, createSemester, updateSemester, deleteSemester } = useSemesters();
  const { courses, loading: coursesLoading, createCourse, updateCourse, deleteCourse } = useCourses();

  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const loading = semestersLoading || coursesLoading;

  const handleSemesterSubmit = async (formData, confirmRegenerate = false) => {
    try {
      if (editingSemester) {
        await updateSemester(editingSemester._id, { ...formData, ...(confirmRegenerate && { confirmRegenerate: true }) });
        toast.success('Semester updated');
      } else {
        await createSemester(formData);
        toast.success('Semester created');
      }
      setShowSemesterForm(false);
      setEditingSemester(null);
    } catch (error) {
      const data = error.response?.data;
      if (data?.needsConfirmation) {
        const details = data.affectedCourses.map((c) => `• ${c.code} - ${c.title} (${c.weekCount} weeks)`).join('\n');
        const confirmed = window.confirm(
          `${data.message}\n\nAffected courses:\n${details}\n\nContinue and regenerate?`
        );
        if (confirmed) {
          await handleSemesterSubmit(formData, true);
        }
        return;
      }
      toast.error(data?.message || 'Failed to save semester');
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm('Delete this semester? It must have no courses left.')) return;
    try {
      await deleteSemester(id);
      toast.success('Semester deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete semester');
    }
  };

  const handleCourseSubmit = async (formData) => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse._id, formData);
        toast.success('Course updated');
      } else {
        await createCourse(formData);
        toast.success('Course created');
      }
      setShowCourseForm(false);
      setEditingCourse(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All its class times, sprints, weeks, and deliverables will also be deleted.')) return;
    try {
      await deleteCourse(id);
      toast.success('Course deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
  };

  const coursesBySemester = (semesterId) => courses.filter((c) => (c.semester?._id || c.semester) === semesterId);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
            <p className="text-slate-600 mt-1">Manage your courses across semesters</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSemesterForm(true)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              + New Semester
            </button>
            <button
              onClick={() => { setEditingCourse(null); setShowCourseForm(true); }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              disabled={semesters.length === 0}
              title={semesters.length === 0 ? 'Create a semester first' : ''}
            >
              + New Course
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : semesters.length === 0 ? (
          <div className="card text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">🗓️</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No semesters yet</h3>
            <p className="text-slate-600 mb-6">Create a semester before adding courses</p>
            <button onClick={() => setShowSemesterForm(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              Create Your First Semester
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {semesters.map((semester) => {
              const semesterCourses = coursesBySemester(semester._id);
              return (
                <div key={semester._id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{semester.name}</h2>
                      <p className="text-sm text-slate-500">
                        {formatDateDisplay(semester.startDate)} – {formatDateDisplay(semester.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setEditingSemester(semester); setShowSemesterForm(true); }}
                        className="text-sm text-slate-500 hover:text-primary-600"
                      >
                        Edit dates
                      </button>
                      {semesterCourses.length === 0 && (
                        <button onClick={() => handleDeleteSemester(semester._id)} className="text-sm text-slate-400 hover:text-red-600">
                          Delete semester
                        </button>
                      )}
                    </div>
                  </div>

                  {semesterCourses.length === 0 ? (
                    <p className="text-sm text-slate-400">No courses in this semester yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {semesterCourses.map((course) => (
                        <div key={course._id} className="relative group bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                          <Link to={`/courses/${course._id}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{course.code}</span>
                            </div>
                            <h3 className="font-semibold text-slate-900">{course.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {course.credits} credits{course.instructor && ` • ${course.instructor}`}
                            </p>
                          </Link>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => { setEditingCourse(course); setShowCourseForm(true); }}
                              className="bg-white rounded-lg shadow-md p-1.5 hover:bg-slate-50 text-sm"
                              title="Edit course"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="bg-white rounded-lg shadow-md p-1.5 hover:bg-slate-50 text-sm"
                              title="Delete course"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSemesterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingSemester ? 'Edit Semester' : 'New Semester'}</h2>
              <button
                onClick={() => { setShowSemesterForm(false); setEditingSemester(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {editingSemester && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                  Changing the dates on a semester that already has courses with generated weeks will ask you to confirm before regenerating them.
                </p>
              )}
              <SemesterForm
                initialData={editingSemester || {}}
                onSubmit={(formData) => handleSemesterSubmit(formData)}
                onCancel={() => { setShowSemesterForm(false); setEditingSemester(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingCourse ? 'Edit Course' : 'New Course'}</h2>
              <button onClick={() => { setShowCourseForm(false); setEditingCourse(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <CourseForm
                initialData={editingCourse || {}}
                semesters={semesters}
                onSubmit={handleCourseSubmit}
                onCancel={() => { setShowCourseForm(false); setEditingCourse(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CourseList;
