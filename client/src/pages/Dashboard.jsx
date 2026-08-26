import { useCourses, useDeliverables, useSchedule } from '../hooks';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { courses, loading: coursesLoading, stats } = useCourses();
  const { deliverables, loading: deliverablesLoading } = useDeliverables();
  const { scheduleItems, loading: scheduleLoading } = useSchedule();

  const isLoading = coursesLoading || deliverablesLoading || scheduleLoading;

  const calculateStats = () => {
    if (stats) {
      return {
        totalCourses: stats.totalCourses || 0,
        totalCredits: stats.totalCredits || 0,
        upcomingDeliverables: stats.upcomingDeliverables || 0,
        completionRate: stats.completionRate || 0,
      };
    }

    const upcomingDeliverables = deliverables.filter(
      (d) => !d.isCompleted && new Date(d.dueDate) >= new Date()
    ).length;

    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

    return {
      totalCourses: courses.length,
      totalCredits,
      upcomingDeliverables,
      completionRate: 0,
    };
  };

  const statCards = [
    {
      title: 'Total Courses',
      value: isLoading ? '...' : calculateStats().totalCourses,
      icon: '📚',
      color: 'bg-primary-50 text-primary-600',
    },
    {
      title: 'Total Credits',
      value: isLoading ? '...' : calculateStats().totalCredits,
      icon: '🎓',
      color: 'bg-accent-50 text-accent-600',
    },
    {
      title: 'Upcoming Deliverables',
      value: isLoading ? '...' : calculateStats().upcomingDeliverables,
      icon: '📅',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'This Week',
      value: isLoading ? '...' : scheduleItems.length,
      icon: '🗓️',
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  const upcomingDeliverables = deliverables
    .filter((d) => !d.isCompleted)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your course overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              if (index === 0) navigate('/courses');
              else if (index === 1) navigate('/courses');
              else if (index === 2) navigate('/deliverables');
              else if (index === 3) navigate('/schedule');
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming Deliverables</h2>
              <Link to="/courses" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {upcomingDeliverables.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-4xl mb-2">🎉</p>
                <p>No upcoming deliverables</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeliverables.map((del) => (
                  <div key={del._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{del.title}</p>
                      <p className="text-sm text-slate-500">
                        {del.course?.code || 'Unknown'} • {del.type}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        new Date(del.dueDate) < new Date()
                          ? 'bg-red-100 text-red-700'
                          : new Date(del.dueDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {new Date(del.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link
                to="/courses"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span>➕</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add New Course</p>
                  <p className="text-sm text-slate-600">Create a new course entry</p>
                </div>
              </Link>
              <Link
                to="/schedule"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <span>📅</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">View Schedule</p>
                  <p className="text-sm text-slate-600">See your weekly timetable</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <p className="text-slate-700">
                Create your first semester to organize your courses
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <p className="text-slate-700">
                Add courses with details like code, credits, and instructor
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <p className="text-slate-700">
                Schedule your courses on the weekly timetable
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">4</span>
              </div>
              <p className="text-slate-700">
                Track assignments and exams with deliverables
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;