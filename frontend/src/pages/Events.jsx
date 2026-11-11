import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, MapPin, Clock, User, Pencil, Trash2, ExternalLink, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Tabs from '../components/ui/Tabs';
import EventModal from '../components/events/EventModal';
import { useApi } from '../hooks/useApi';
import { api, errMessage, absoluteUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

const tabs = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function Events() {
  const { user, role } = useAuth();
  const canManage = role === 'faculty' || role === 'admin';

  const [filter, setFilter] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const params = useMemo(() => ({ filter, page, limit: 9 }), [filter, page]);
  const { data, loading, error, pagination, refetch, setData } = useApi('/events', { params });

  useEffect(() => { setPage(1); }, [filter]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (ev) => { setEditing(ev); setModalOpen(true); };

  const onDelete = async () => {
    await api.delete(`/events/${toDelete._id}`);
    toast.success('Event deleted');
    setData((prev) => (prev || []).filter((e) => e._id !== toDelete._id));
  };

  const toggleRsvp = async (ev) => {
    // optimistic
    const meId = String(user?._id);
    const registered = (ev.attendees || []).some((a) => String(a) === meId);
    setData((prev) =>
      (prev || []).map((e) =>
        e._id === ev._id
          ? { ...e, attendees: registered ? e.attendees.filter((a) => String(a) !== meId) : [...(e.attendees || []), meId] }
          : e
      )
    );
    try {
      await api.post(`/events/${ev._id}/register`);
    } catch (e) {
      toast.error(errMessage(e));
      refetch();
    }
  };

  const canEdit = (ev) => role === 'admin' || String(ev.createdBy?._id || ev.createdBy) === String(user?._id);
  const isRegistered = (ev) => (ev.attendees || []).some((a) => String(a) === String(user?._id));

  return (
    <div>
      <PageHeader
        title="Events"
        description="Workshops, hackathons, seminars and fests across campus."
        icon={CalendarDays}
        actions={canManage && <button className="btn-primary" onClick={openCreate}><Plus size={16} /> New event</button>}
      />

      <div className="mb-6">
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <Spinner label="Loading events…" />
      ) : error ? (
        <EmptyState icon={CalendarDays} title="Couldn’t load events" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={CalendarDays} title={`No ${filter} events`} message={canManage ? 'Create an event to get started.' : 'Check back soon for new events.'} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((ev) => (
              <article key={ev._id} className="card flex flex-col overflow-hidden">
                {ev.bannerUrl ? (
                  <img src={absoluteUrl(ev.bannerUrl)} alt="" className="h-32 w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                    <CalendarDays size={40} className="opacity-80" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {ev.category && <Badge className="bg-brand-50 text-brand-700">{ev.category}</Badge>}
                    {canEdit(ev) && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(ev)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(ev)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800">{ev.name}</h3>
                  {ev.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ev.description}</p>}

                  <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                    <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> {formatDateTime(ev.startAt)}</p>
                    {ev.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {ev.location}</p>}
                    {ev.organizer && <p className="flex items-center gap-2"><User size={14} className="text-slate-400" /> {ev.organizer}</p>}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    {filter === 'upcoming' && (
                      <button
                        onClick={() => toggleRsvp(ev)}
                        className={isRegistered(ev) ? 'btn-secondary flex-1 justify-center' : 'btn-primary flex-1 justify-center'}
                      >
                        {isRegistered(ev) ? <><Check size={16} /> Registered</> : 'Register'}
                      </button>
                    )}
                    {ev.registrationUrl && (
                      <a href={ev.registrationUrl} target="_blank" rel="noreferrer" className="btn-ghost" title="External registration">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <span className="ml-auto text-xs text-slate-400">{ev.attendees?.length || 0} going</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <EventModal open={modalOpen} onClose={() => setModalOpen(false)} event={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this event?"
        message="This event will be permanently removed."
        confirmText="Delete"
      />
    </div>
  );
}
