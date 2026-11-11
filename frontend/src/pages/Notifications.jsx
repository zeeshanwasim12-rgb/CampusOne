import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Megaphone, CalendarDays, BookOpen, MessageSquare, MessagesSquare, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { useApi } from '../hooks/useApi';
import { api, errMessage } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/format';
import { useState } from 'react';

const typeIcon = {
  notice: Megaphone,
  event: CalendarDays,
  resource: BookOpen,
  community: MessagesSquare,
  chat: MessageSquare,
  system: Info,
};
const typeTint = {
  notice: 'bg-amber-50 text-amber-600',
  event: 'bg-emerald-50 text-emerald-600',
  resource: 'bg-brand-50 text-brand-600',
  community: 'bg-purple-50 text-purple-600',
  chat: 'bg-sky-50 text-sky-600',
  system: 'bg-slate-100 text-slate-500',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { refreshUnread } = useNotifications();
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refetch, setData } = useApi('/notifications', { params: { page, limit: 20 } });

  const open = async (n) => {
    if (!n.isRead) {
      setData((prev) => (prev || []).map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      api.patch(`/notifications/${n._id}/read`).then(refreshUnread).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setData((prev) => (prev || []).map((x) => ({ ...x, isRead: true })));
      refreshUnread();
      toast.success('All caught up!');
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const remove = async (e, id) => {
    e.stopPropagation();
    setData((prev) => (prev || []).filter((x) => x._id !== id));
    api.delete(`/notifications/${id}`).then(refreshUnread).catch(() => {});
  };

  const hasUnread = (data || []).some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        icon={Bell}
        actions={hasUnread && <button className="btn-secondary" onClick={markAll}><Check size={16} /> Mark all read</button>}
      />

      {loading ? (
        <Spinner label="Loading notifications…" />
      ) : error ? (
        <EmptyState icon={Bell} title="Couldn’t load notifications" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={Bell} title="No notifications yet" message="Updates about notices, events, resources and comments will appear here." />
      ) : (
        <>
          <div className="card divide-y divide-slate-100">
            {data.map((n) => {
              const Icon = typeIcon[n.type] || Info;
              return (
                <div
                  key={n._id}
                  onClick={() => open(n)}
                  className={`flex cursor-pointer items-start gap-3 p-4 transition hover:bg-slate-50 ${n.isRead ? '' : 'bg-brand-50/40'}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeTint[n.type] || typeTint.system}`}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    {n.message && <p className="text-sm text-slate-500">{n.message}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                  <button onClick={(e) => remove(e, n._id)} className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
