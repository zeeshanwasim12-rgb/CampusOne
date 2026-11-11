import { Link, Navigate } from 'react-router-dom';
import {
  GraduationCap,
  Map,
  Users,
  BookOpen,
  MessagesSquare,
  Megaphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Map, title: 'Virtual Campus Map', desc: 'Find departments, labs and facilities on an interactive campus map.' },
  { icon: Users, title: 'Faculty Cabin Finder', desc: 'Locate faculty cabins, office hours and availability in seconds.' },
  { icon: BookOpen, title: 'Academic Resources', desc: 'PYQs, assignments, lab manuals and study material — all in one place.' },
  { icon: MessagesSquare, title: 'Community & Chat', desc: 'Ask doubts, share notes and chat with peers in real time.' },
  { icon: Megaphone, title: 'Notices & Events', desc: 'Never miss an announcement, deadline or campus event again.' },
  { icon: Sparkles, title: 'Smart Recommendations', desc: 'Personalised resource suggestions based on your semester & subjects.' },
];

const roles = [
  { title: 'Students', points: ['Access & bookmark resources', 'Join the community feed', 'Track notices & events'] },
  { title: 'Faculty', points: ['Upload verified material', 'Post notices & events', 'Manage cabin availability'] },
  { title: 'Admins', points: ['Approve resources', 'Manage users & campus', 'Moderate the community'] },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — full-bleed campus photo with nav + headline over an overlay */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/75 via-brand-900/60 to-brand-950/85" />

        {/* Nav */}
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-extrabold">CampusOne</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn text-white hover:bg-white/10">Sign in</Link>
            <Link to="/register" className="btn bg-white text-brand-700 shadow-sm hover:bg-brand-50">Get started</Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 text-center text-white sm:pt-20">
          <span className="badge border border-white/25 bg-white/15 text-white backdrop-blur">
            <Sparkles size={13} /> MIT School of Computing
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight drop-shadow sm:text-5xl">
            One platform for your entire <span className="text-brand-200">campus life</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-50/90">
            CampusOne unifies academic resources, campus navigation, faculty discovery, community
            collaboration and announcements into a single, cloud-based student productivity platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn bg-white px-6 py-3 text-base text-brand-700 shadow-md hover:bg-brand-50">
              Create free account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-800">Everything students need, in one place</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Purpose-built for the day-to-day workflow of a computing student.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition hover:shadow-card-hover">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-800">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-800">Built for every role on campus</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {roles.map((r) => (
              <div key={r.title} className="card p-6">
                <h3 className="text-lg font-bold text-brand-700">{r.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Ready to simplify campus life?</h2>
        <p className="mt-3 text-slate-600">Join your peers on CampusOne today — it’s free for students.</p>
        <Link to="/register" className="btn-primary mt-6 px-6 py-3 text-base">
          Get started <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} CampusOne · MIT School of Computing · A student PBL project
      </footer>
    </div>
  );
}
