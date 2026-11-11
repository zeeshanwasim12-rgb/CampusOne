import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../ui/Avatar';
import { cn } from '../../utils/cn';

const roleLabel = { student: 'Student', faculty: 'Faculty', admin: 'Administrator' };

/** Top bar: mobile menu toggle, global search, notifications bell, profile menu. */
export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl lg:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu size={20} />
      </button>

      <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search resources, notices, faculty…"
          className="input pl-9"
        />
      </form>

      <div className="flex flex-1 items-center justify-end gap-1 sm:flex-none">
        <Link
          to="/notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-slate-700">{user?.name}</span>
              <span className="block text-[11px] leading-tight text-slate-400">{roleLabel[user?.role]}</span>
            </span>
            <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
          </button>

          <div
            className={cn(
              'absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all',
              menuOpen ? 'visible opacity-100' : 'invisible -translate-y-1 opacity-0'
            )}
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-700">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
              <UserIcon size={16} /> My Profile
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
