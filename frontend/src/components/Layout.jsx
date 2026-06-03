import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Mes Quiz' },
  { to: '/history', icon: '📊', label: 'Historique' },
];

export default function Layout({ children, title, actions }) {
  const { user, logout } = useAuth();
  const { settings } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              {settings.app_logo
                ? <img src={settings.app_logo} alt="Logo" className="h-8 w-8 object-contain" />
                : <span className="text-2xl">🎮</span>
              }
              <span className="font-display font-bold text-white text-lg hidden sm:block">
                {settings.app_name || 'QuizzApp'}
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(n => (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname.startsWith(n.to) ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link to="/admin"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname.startsWith('/admin') ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span>⚙️</span>Administration
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.username}</span>
            {user?.role === 'admin' && (
              <span className="badge bg-brand-500/20 text-brand-400">Admin</span>
            )}
            <button onClick={handleLogout} className="btn-ghost btn-sm">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Page header */}
      {(title || actions) && (
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            {title && <h1 className="text-xl font-display font-bold text-white">{title}</h1>}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-50">
        <div className="flex">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors
                ${location.pathname.startsWith(n.to) ? 'text-brand-400' : 'text-gray-500'}`}>
              <span className="text-xl">{n.icon}</span>{n.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin"
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors
                ${location.pathname.startsWith('/admin') ? 'text-brand-400' : 'text-gray-500'}`}>
              <span className="text-xl">⚙️</span>Admin
            </Link>
          )}
          <button onClick={handleLogout} className="flex-1 flex flex-col items-center py-3 text-xs font-medium text-gray-500">
            <span className="text-xl">🚪</span>Quitter
          </button>
        </div>
      </nav>
      <div className="md:hidden h-16" />
    </div>
  );
}
