import { Link } from 'react-router-dom';
import { GraduationCap, Map, BookOpen, Users, MessagesSquare } from 'lucide-react';

/** Split-screen wrapper for auth pages: campus-photo brand panel + glass form. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Brand panel — campus photo behind a brand gradient */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/85 via-brand-800/85 to-brand-950/90" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-brand-400/20" />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap size={22} />
          </div>
          <span className="text-xl font-extrabold">CampusOne</span>
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug drop-shadow-sm">
            Your entire campus,<br />unified in one place.
          </h2>
          <div className="mt-8 space-y-4 text-brand-50">
            {[
              { icon: Map, t: 'Navigate campus & find faculty cabins' },
              { icon: BookOpen, t: 'Access PYQs, notes & lab manuals' },
              { icon: MessagesSquare, t: 'Collaborate with the community' },
              { icon: Users, t: 'Stay updated with notices & events' },
            ].map((i) => (
              <div key={i.t} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <i.icon size={18} />
                </div>
                <span className="text-sm">{i.t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-brand-100">© {new Date().getFullYear()} MIT School of Computing</p>
      </div>

      {/* Form column — glass card floating over the campus backdrop */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm animate-slide-up rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-extrabold text-slate-800">CampusOne</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
