import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Course Planner</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/courses"
              className="text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-md transition-colors"
            >
              Courses
            </Link>

            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
