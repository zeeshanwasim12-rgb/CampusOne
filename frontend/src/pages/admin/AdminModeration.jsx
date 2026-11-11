import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, CheckCheck, Trash2, ExternalLink, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useApi } from '../../hooks/useApi';
import { api, errMessage } from '../../services/api';
import { timeAgo } from '../../utils/format';

export default function AdminModeration() {
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { data, loading, error, pagination, refetch, setData } = useApi('/admin/moderation/reported', {
    params: { page, limit: 10 },
  });

  const patch = async (post, body, successMsg) => {
    setBusyId(post._id);
    try {
      await api.patch(`/admin/moderation/posts/${post._id}`, body);
      toast.success(successMsg);
      // clearReports removes the post from this list entirely; hide/unhide updates in place.
      if (body.clearReports) setData((prev) => (prev || []).filter((p) => p._id !== post._id));
      else setData((prev) => (prev || []).map((p) => (p._id === post._id ? { ...p, ...body } : p)));
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    await api.delete(`/community/posts/${toDelete._id}`);
    toast.success('Post deleted');
    setData((prev) => (prev || []).filter((p) => p._id !== toDelete._id));
  };

  return (
    <div>
      <PageHeader title="Content Moderation" description="Review posts reported by the community and take action." icon={ShieldAlert} />

      {loading ? (
        <Spinner label="Loading reports…" />
      ) : error ? (
        <EmptyState icon={ShieldAlert} title="Couldn’t load reports" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={CheckCheck} title="All clear" message="There are no reported posts to review right now." />
      ) : (
        <>
          <div className="space-y-4">
            {data.map((p) => (
              <div key={p._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-600">{p.category}</Badge>
                      <Badge className="bg-red-100 text-red-700"><Flag size={11} className="mr-0.5" /> {p.reportCount ?? p.reports?.length ?? 0} report{(p.reportCount ?? p.reports?.length) === 1 ? '' : 's'}</Badge>
                      {p.isHidden && <Badge className="bg-slate-800 text-white">Hidden</Badge>}
                    </div>
                    <Link to={`/community/${p._id}`} className="text-lg font-semibold text-slate-800 hover:text-brand-700">{p.title}</Link>
                    <p className="text-xs text-slate-400">by {p.author?.name || 'Unknown'} · {p.author?.role}</p>
                  </div>
                  <Link to={`/community/${p._id}`} className="btn-ghost btn-sm shrink-0"><ExternalLink size={15} /> View</Link>
                </div>

                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{p.body}</p>

                {/* Reports */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Reports</p>
                  <ul className="space-y-1.5">
                    {(p.reports || []).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Flag size={13} className="mt-0.5 shrink-0 text-red-400" />
                        <span>
                          <span className="text-slate-500">{r.reason || 'No reason given'}</span>
                          <span className="text-slate-400"> — {r.by?.name || 'A user'}{r.at ? `, ${timeAgo(r.at)}` : ''}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {p.isHidden ? (
                    <button onClick={() => patch(p, { isHidden: false }, 'Post is now visible')} disabled={busyId === p._id} className="btn-secondary btn-sm">
                      <Eye size={15} /> Unhide
                    </button>
                  ) : (
                    <button onClick={() => patch(p, { isHidden: true }, 'Post hidden')} disabled={busyId === p._id} className="btn-secondary btn-sm">
                      <EyeOff size={15} /> Hide
                    </button>
                  )}
                  <button onClick={() => patch(p, { clearReports: true }, 'Reports dismissed')} disabled={busyId === p._id} className="btn-secondary btn-sm">
                    <CheckCheck size={15} /> Dismiss reports
                  </button>
                  <button onClick={() => setToDelete(p)} className="btn-danger btn-sm">
                    <Trash2 size={15} /> Delete post
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this post?"
        message={`“${toDelete?.title}” and all its comments will be permanently removed.`}
        confirmText="Delete post"
      />
    </div>
  );
}
