import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderCheck, Check, X, Trash2, ExternalLink, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useApi } from '../../hooks/useApi';
import { api, errMessage } from '../../services/api';
import { resourceTypeLabel } from '../../utils/constants';
import { formatDate } from '../../utils/format';

const tabs = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];
const statusStyles = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };

export default function AdminResources() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const params = useMemo(() => ({ page, limit: 15, ...(status && { status }) }), [page, status]);
  const { data, loading, error, pagination, refetch, setData } = useApi('/resources', { params });

  useEffect(() => { setPage(1); }, [status]);

  const removeFromList = (id) => setData((prev) => (prev || []).filter((r) => r._id !== id));

  const approve = async (r) => {
    setBusyId(r._id);
    try {
      await api.patch(`/resources/${r._id}/moderate`, { action: 'approve' });
      toast.success('Resource approved');
      if (status === 'pending' || status === 'rejected') removeFromList(r._id);
      else setData((prev) => prev.map((x) => (x._id === r._id ? { ...x, status: 'approved' } : x)));
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    const r = rejecting;
    setBusyId(r._id);
    try {
      await api.patch(`/resources/${r._id}/moderate`, { action: 'reject', reason });
      toast.success('Resource rejected');
      if (status === 'pending' || status === 'approved') removeFromList(r._id);
      else setData((prev) => prev.map((x) => (x._id === r._id ? { ...x, status: 'rejected', rejectionReason: reason } : x)));
      setRejecting(null);
      setReason('');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    await api.delete(`/resources/${toDelete._id}`);
    toast.success('Resource deleted');
    removeFromList(toDelete._id);
  };

  return (
    <div>
      <PageHeader title="Resource Approvals" description="Review and moderate resources uploaded by students." icon={FolderCheck} />

      <div className="mb-6"><Tabs tabs={tabs} value={status} onChange={setStatus} /></div>

      {loading ? (
        <Spinner label="Loading resources…" />
      ) : error ? (
        <EmptyState icon={FileText} title="Couldn’t load resources" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={FolderCheck} title="Nothing here" message={status === 'pending' ? 'No resources are waiting for approval. ' : 'No resources match this filter.'} />
      ) : (
        <>
          <div className="space-y-3">
            {data.map((r) => (
              <div key={r._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge className="bg-brand-50 text-brand-700">{resourceTypeLabel(r.type)}</Badge>
                    <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                  </div>
                  <Link to={`/resources/${r._id}`} className="font-semibold text-slate-800 hover:text-brand-700">{r.title}</Link>
                  <p className="text-xs text-slate-400">
                    {r.subject} · by {r.uploadedBy?.name || 'Unknown'} · {formatDate(r.createdAt)}
                  </p>
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600">Reason: {r.rejectionReason}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link to={`/resources/${r._id}`} className="btn-ghost btn-sm" title="View"><ExternalLink size={15} /></Link>
                  {r.status !== 'approved' && (
                    <button onClick={() => approve(r)} disabled={busyId === r._id} className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700">
                      <Check size={15} /> Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => { setRejecting(r); setReason(''); }} disabled={busyId === r._id} className="btn-secondary btn-sm text-red-600">
                      <X size={15} /> Reject
                    </button>
                  )}
                  <button onClick={() => setToDelete(r)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      {/* Reject reason modal */}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject resource"
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={confirmReject} loading={busyId === rejecting?._id}>Reject</Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-500">Optionally tell the uploader why “{rejecting?.title}” was rejected.</p>
        <Textarea rows={3} placeholder="e.g. Wrong subject, low quality scan, duplicate…" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this resource?"
        message="This permanently removes the file and its metadata."
        confirmText="Delete"
      />
    </div>
  );
}
