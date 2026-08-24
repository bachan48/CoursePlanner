import { Link } from 'react-router-dom';

const CourseCard = ({ course, onDelete }) => {
  const isOverdue = course.deliverables?.some(
    (d) => !d.isCompleted && new Date(d.dueDate) < new Date()
  );

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {course.color && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: course.color }}
              />
            )}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {course.code}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 truncate">{course.title}</h3>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(course._id);
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
            title="Delete course"
          >
            ✕
          </button>
        )}
      </div>

      {course.instructor && (
        <p className="text-sm text-slate-600 mb-2">👤 {course.instructor}</p>
      )}

      {course.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{course.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
        </span>
        {course.semester && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
            {course.semester}
          </span>
        )}
      </div>

      <Link
        to={`/courses/${course._id}`}
        className="mt-3 block text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
};

export default CourseCard;