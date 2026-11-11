import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Search, Plus, Pin, Paperclip, Pencil, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import NoticeModal from '../components/notices/NoticeModal';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { api, absoluteUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import { NOTICE_CATEGORIES, PRIORITIES, priorityStyles, categoryStyles } from '../utils/constants';

const categoryOptions = NOTICE_CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }));
const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }));

export default function Notices() {
  const { user, role } = useAuth();
  const canManage = role === 'faculty' || role === 'admin';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: 10, ...(debouncedSearch && { search: debouncedSearch }), ...(category && { category }), ...(priority && { priority }) }),
    [page, debouncedSearch, category, priority]
  );
  const { data, loading, error, pagination, refetch, setData } = useApi('/notices', { params });

  useEffect(() => { setPage(1); }, [debouncedSearch, category, priority]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (n) => { setEditing(n); setModalOpen(true); };

  const onDelete = async () => {
    await api.delete(`/notices/${toDelete._id}`);
    toast.success('Notice deleted');
    setData((prev) => (prev || []).filter((n) => n._id !== toDelete._id));
  };

  const canEdit = (n) => role === 'admin' || String(n.postedBy?._id || n.postedBy) === String(user?._id);

  return (
    <div>
      <PageHeader
        title="Notices"
        description="Official announcements from faculty and administration."
        icon={Megaphone}
        actions={canManage && <button className="btn-primary" onClick={openCreate}><Plus size={16} /> New notice</button>}
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search notices…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Select className="w-40" placeholder="All categories" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
          <Select className="w-36" placeholder="Any priority" options={priorityOptions} value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading notices…" />
      ) : error ? (
        <EmptyState icon={Megaphone} title="Couldn’t load notices" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={Megaphone} title="No notices found" message={canManage ? 'Publish the first notice for your students.' : 'Check back later for announcements.'} />
      ) : (
        <>
          <div className="space-y-4">
            {data.map((n) => (
              <article key={n._id} className={`card p-5 ${n.isPinned ? 'border-l-4 border-l-brand-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {n.isPinned && <Pin size={14} className="text-brand-600" />}
                      <span className={`badge ${categoryStyles[n.category] || 'bg-slate-100 text-slate-600'}`}>{n.category}</span>
                      <Badge className={priorityStyles[n.priority]}>{n.priority}</Badge>
                      {n.department?.name && <span className="text-xs text-slate-400">{n.department.name}</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{n.title}</h3>
                  </div>
                  {canEdit(n) && (
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => openEdit(n)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil size={16} /></button>
                      <button onClick={() => setToDelete(n)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{n.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>By {n.postedBy?.name || 'Staff'}</span>
                  <span>{formatDate(n.createdAt)}</span>
                  {n.dueDate && <span className="flex items-center gap-1 text-amber-600"><Calendar size={12} /> Due {formatDate(n.dueDate)}</span>}
                  {n.attachment?.url && (
                    <a href={absoluteUrl(n.attachment.url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-brand-600 hover:underline">
                      <Paperclip size={12} /> {n.attachment.originalName || 'Attachment'}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <NoticeModal open={modalOpen} onClose={() => setModalOpen(false)} notice={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this notice?"
        message="This announcement will be permanently removed."
        confirmText="Delete"
      />
    </div>
  );
}
