import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',           icon: '⚡', label: 'Query Playground' },
  { to: '/dashboard/databases', icon: '🗄️', label: 'Databases' },
  { to: '/dashboard/users',     icon: '👥', label: 'Team',    adminOnly: true },
  { to: '/dashboard/settings',  icon: '⚙️', label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const roleBadgeClass = {
    admin: 'badge-admin', engineer: 'badge-engineer',
    analyst: 'badge-analyst', user: 'badge-user',
  }[user?.role] || 'badge-user';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">

      {/* ── Sidebar ── */}
      <aside className="sidebar flex-shrink-0 flex flex-col border-r border-white/5 bg-[#13161f]">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm">Q</div>
            <span className="font-bold text-lg gradient-text">Qiral</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                   ${isActive
                     ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                     : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`
                }>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User card */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{user?.fullName || user?.email}</div>
              <span className={roleBadgeClass}>{user?.role}</span>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-gray-500 hover:text-red-400 transition-colors text-base">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
