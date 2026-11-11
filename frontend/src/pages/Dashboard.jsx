import { Link } from 'react-router-dom';
import {
  Sparkles,
  Megaphone,
  CalendarDays,
  Bookmark,
  Upload,
  Users,
  BookOpen,
  ShieldCheck,
  FolderClock,
  FileWarning,
  Building2,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import ResourceCard from '../components/resources/ResourceCard';
import { formatDate, formatDateTime } from '../utils/format';
import { categoryStyles, priorityStyles } from '../utils/constants';

export default function Dashboard() {
  const { user, role } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === 'admin'
            ? 'Here’s what’s happening across CampusOne today.'
            : role === 'faculty'
            ? 'Manage your resources, notices and events.'
            : 'Here’s your personalised campus overview.'}
        </p>
      </div>

      {role === 'admin' ? <AdminDashboard /> : role === 'faculty' ? <FacultyDashboard /> : <StudentDashboard />}
    </div>
  );
}

/* ---------------- Student ---------------- */
function StudentDashboard() {
  const { data: recs, loading: recsLoading } = useApi('/recommendations', { params: { limit: 3 } });
  const { data: notices } = useApi('/notices', { params: { limit: 4 } });
  const { data: events } = useApi('/events', { params: { filter: 'upcoming', limit: 4 } });
  const { pagination: bmPage } = useApi('/bookmarks', { params: { limit: 1 } });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/resources" icon={BookOpen} label="Resources" tint="brand" />
        <QuickLink to="/campus-map" icon={MapPin} label="Campus Map" tint="emerald" />
        <QuickLink to="/faculty" icon={Users} label="Find Faculty" tint="purple" />
        <QuickLink to="/bookmarks" icon={Bookmark} label={`Bookmarks (${bmPage?.total ?? 0})`} tint="amber" />
      </div>

      <Section title="Recommended for you" icon={Sparkles} to="/resources" linkLabel="View all">
        {recsLoading ? (
          <Spinner />
        ) : !recs?.length ? (
          <EmptyRow text="Set your subjects in your profile and bookmark resources to get personalised picks." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map(({ resource, reason }) => (
              <div key={resource._id}>
                <ResourceCard resource={resource} />
                <p className="mt-1.5 px-1 text-xs italic text-brand-600">{reason}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <NoticesWidget notices={notices} />
        <EventsWidget events={events} />
      </div>
    </div>
  );
}

/* ---------------- Faculty ---------------- */
function FacultyDashboard() {
  const { data: notices } = useApi('/notices', { params: { limit: 5 } });
  const { data: events } = useApi('/events', { params: { filter: 'upcoming', limit: 5 } });

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/resources" icon={Upload} label="Upload Resource" tint="brand" />
        <QuickLink to="/notices" icon={Megaphone} label="Post Notice" tint="amber" />
        <QuickLink to="/events" icon={CalendarDays} label="Create Event" tint="emerald" />
        <QuickLink to="/faculty" icon={Users} label="Faculty Directory" tint="purple" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <NoticesWidget notices={notices} />
        <EventsWidget events={events} />
      </div>
    </div>
  );
}

/* ---------------- Admin ---------------- */
function AdminDashboard() {
  const { data: stats, loading } = useApi('/admin/stats');

  if (loading) return <Spinner label="Loading platform stats…" />;
  const c = stats?.counts || {};

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Students" value={c.students} tint="brand" />
        <StatCard icon={ShieldCheck} label="Faculty" value={c.faculty} tint="purple" />
        <StatCard icon={BookOpen} label="Approved Resources" value={c.resources} tint="emerald" />
        <StatCard icon={FolderClock} label="Pending Approval" value={c.pendingResources} tint="amber" to="/admin/resources" />
        <StatCard icon={Megaphone} label="Notices" value={c.notices} tint="brand" />
        <StatCard icon={CalendarDays} label="Events" value={c.events} tint="emerald" />
        <StatCard icon={FileWarning} label="Reported Posts" value={c.reportedPosts} tint="red" to="/admin/moderation" />
        <StatCard icon={Building2} label="Departments" value={c.departments} tint="purple" />
      </div>

      <Section title="Recent uploads" icon={BookOpen} to="/admin/resources" linkLabel="Manage">
        <div className="card divide-y divide-slate-100">
          {!stats?.recentUploads?.length ? (
            <EmptyRow text="No resources uploaded yet." />
          ) : (
            stats.recentUploads.map((r) => (
              <Link key={r._id} to={`/resources/${r._id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.subject} · by {r.uploadedBy?.name || 'Unknown'}</p>
                </div>
                <Badge className={r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                  {r.status}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- Shared widgets ---------------- */
const tints = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

function QuickLink({ to, icon: Icon, label, tint }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 transition hover:shadow-card-hover">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon size={22} />
      </div>
      <span className="font-semibold text-slate-700">{label}</span>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, tint, to }) {
  const inner = (
    <div className="card flex items-center gap-4 p-5 transition hover:shadow-card-hover">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tints[tint]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? 0}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Section({ title, icon: Icon, to, linkLabel, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-brand-600" />
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        </div>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function NoticesWidget({ notices }) {
  return (
    <Section title="Latest notices" icon={Megaphone} to="/notices" linkLabel="All notices">
      <div className="card divide-y divide-slate-100">
        {!notices?.length ? (
          <EmptyRow text="No notices yet." />
        ) : (
          notices.map((n) => (
            <div key={n._id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-slate-700">{n.title}</p>
                <Badge className={priorityStyles[n.priority]}>{n.priority}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span className={`badge ${categoryStyles[n.category] || 'bg-slate-100 text-slate-600'}`}>{n.category}</span>
                <span>{formatDate(n.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

function EventsWidget({ events }) {
  return (
    <Section title="Upcoming events" icon={CalendarDays} to="/events" linkLabel="All events">
      <div className="card divide-y divide-slate-100">
        {!events?.length ? (
          <EmptyRow text="No upcoming events." />
        ) : (
          events.map((e) => (
            <div key={e._id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <span className="text-[10px] font-semibold uppercase">{formatDate(e.startAt, { month: 'short' }).split(' ')[1] || ''}</span>
                <span className="text-sm font-bold leading-none">{new Date(e.startAt).getDate()}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700">{e.name}</p>
                <p className="truncate text-xs text-slate-400">{formatDateTime(e.startAt)}{e.location ? ` · ${e.location}` : ''}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

function EmptyRow({ text }) {
  return <p className="px-4 py-6 text-center text-sm text-slate-400">{text}</p>;
}
