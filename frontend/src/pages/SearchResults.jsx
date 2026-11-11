import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Users, MapPin, Megaphone, CalendarDays, MessagesSquare } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { resourceTypeLabel } from '../utils/constants';
import { formatDate } from '../utils/format';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [term, setTerm] = useState(q);
  const debounced = useDebounce(term, 400);

  // Keep the URL in sync with the debounced term.
  useEffect(() => {
    if (debounced !== q) setSearchParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const enabled = debounced.trim().length >= 2;
  const { data, loading } = useApi('/search', { params: { q: debounced, limit: 8 }, enabled });
  const groups = data?.groups || {};

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Search" description="Find resources, faculty, locations, notices, events and posts." icon={Search} />

      <div className="relative mb-6">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input py-3 pl-11 text-base"
          placeholder="Search CampusOne…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
      </div>

      {!enabled ? (
        <EmptyState icon={Search} title="Search across campus" message="Type at least 2 characters to search resources, faculty, notices, events and more." />
      ) : loading ? (
        <Spinner label="Searching…" />
      ) : !data?.total ? (
        <EmptyState icon={Search} title="No results found" message={`Nothing matched “${debounced}”. Try a different term.`} />
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-slate-500">{data.total} result{data.total === 1 ? '' : 's'} for “<span className="font-medium text-slate-700">{data.query}</span>”</p>

          <Group title="Resources" icon={BookOpen} items={groups.resources} render={(r) => (
            <ResultRow key={r._id} to={`/resources/${r._id}`} title={r.title} sub={`${resourceTypeLabel(r.type)} · ${r.subject}${r.semester ? ` · Sem ${r.semester}` : ''}`} />
          )} />

          <Group title="Faculty" icon={Users} items={groups.faculty} render={(f) => (
            <ResultRow key={f._id} to="/faculty" title={f.name} sub={[f.designation, f.cabinNumber && `Cabin ${f.cabinNumber}`, f.building].filter(Boolean).join(' · ')} />
          )} />

          <Group title="Campus locations" icon={MapPin} items={groups.locations} render={(l) => (
            <ResultRow key={l._id} to={`/campus-map?focus=${l._id}`} title={l.name} sub={[l.type, l.building, l.roomNumber].filter(Boolean).join(' · ')} />
          )} />

          <Group title="Notices" icon={Megaphone} items={groups.notices} render={(n) => (
            <ResultRow key={n._id} to="/notices" title={n.title} sub={formatDate(n.createdAt)} badge={n.priority} />
          )} />

          <Group title="Events" icon={CalendarDays} items={groups.events} render={(e) => (
            <ResultRow key={e._id} to="/events" title={e.name} sub={[formatDate(e.startAt), e.location].filter(Boolean).join(' · ')} />
          )} />

          <Group title="Community posts" icon={MessagesSquare} items={groups.posts} render={(p) => (
            <ResultRow key={p._id} to={`/community/${p._id}`} title={p.title} sub={p.category} />
          )} />
        </div>
      )}
    </div>
  );
}

function Group({ title, icon: Icon, items, render }) {
  if (!items?.length) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={15} /> {title} <span className="text-slate-300">({items.length})</span>
      </h2>
      <div className="card divide-y divide-slate-100">{items.map(render)}</div>
    </section>
  );
}

function ResultRow({ to, title, sub, badge }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800">{title}</p>
        {sub && <p className="truncate text-sm text-slate-400">{sub}</p>}
      </div>
      {badge && <Badge className="bg-slate-100 capitalize text-slate-600">{badge}</Badge>}
    </Link>
  );
}
