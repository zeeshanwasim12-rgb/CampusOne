import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { navForRole } from './navConfig';

/**
 * Left navigation. On desktop it's a fixed rail; on mobile it slides in over a
 * backdrop (controlled by `open` / `onClose` from AppLayout).
 */
export default function Sidebar({ open, onClose }) {
  const { role } = useAuth();
  const { chatUnread } = useNotifications();
  const sections = navForRole(role);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/40 lg:hidden transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/60 bg-white/75 backdrop-blur-xl transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-100 px-5">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={20} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-800">CampusOne</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">MIT School of Computing</p>
            </div>
          </NavLink>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section, i) => (
            <div key={section.title || i}>
              {section.title && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
                  >
                    <item.icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {item.to === '/chat' && chatUnread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {chatUnread}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} CampusOne
        </div>
      </aside>
    </>
  );
}
