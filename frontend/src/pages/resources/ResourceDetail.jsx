import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useApi } from '../../hooks/useApi';
import { api, errMessage } from '../../services/api';
import { toggleBookmark, downloadResource } from '../../services/resources';
import { formatBytes, formatDate } from '../../utils/format';
import { resourceTypeLabel } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: resource, loading, error, refetch, setData } = useApi(`/resources/${id}`);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner fullPage label="Loading resource…" />;
  if (error || !resource) {
    return (
      <EmptyState icon={FileText} title="Resource not found" message={error || 'This resource may have been removed.'}
        action={<Link to="/resources" className="btn-primary">Back to resources</Link>} />
    );
  }

  const isOwner = String(resource.uploadedBy?._id) === String(user?._id);
  const canManage = isOwner || role === 'admin';

  const onBookmark = async () => {
    try {
      const next = await toggleBookmark(resource._id);
      setData({ ...resource, isBookmarked: next });
      toast.success(next ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onDownload = async () => {
    setBusy(true);
    try {
      await downloadResource(resource._id);
    } catch (e) {
      toast.error(errMessage(e, 'Download failed'));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    await api.delete(`/resources/${resource._id}`);
    toast.success('Resource deleted');
    navigate('/resources');
  };

  const moderate = async (action) => {
    try {
      await api.patch(`/resources/${resource._id}/moderate`, { action });
      toast.success(`Resource ${action}d`);
      refetch();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-brand-50 text-brand-700"><FileText size={12} /> {resourceTypeLabel(resource.type)}</Badge>
          {resource.status !== 'approved' && (
            <Badge className={resource.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
              {resource.status}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-slate-800">{resource.title}</h1>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{resource.subject}</span>
          {resource.semester && <span>· Semester {resource.semester}</span>}
          {resource.course && <span>· {resource.course}</span>}
          {resource.academicYear && <span>· {resource.academicYear}</span>}
        </div>

        {resource.description && <p className="mt-4 whitespace-pre-line text-slate-600">{resource.description}</p>}

        {resource.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {resource.tags.map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">#{t}</span>
            ))}
          </div>
        )}

        {resource.status === 'rejected' && resource.rejectionReason && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Rejected:</strong> {resource.rejectionReason}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-sm sm:grid-cols-4">
          <Meta icon={UserIcon} label="Uploaded by" value={resource.uploadedBy?.name || 'Unknown'} />
          <Meta icon={Download} label="Downloads" value={resource.downloads ?? 0} />
          <Meta icon={Eye} label="Views" value={resource.views ?? 0} />
          <Meta icon={FileText} label="Size" value={resource.file?.size ? formatBytes(resource.file.size) : '—'} />
        </div>
        <p className="mt-3 text-xs text-slate-400">Added on {formatDate(resource.createdAt)} · {resource.file?.originalName}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={onDownload} disabled={busy} className="btn-primary">
            <Download size={16} /> {busy ? 'Preparing…' : 'Download'}
          </button>
          <button onClick={onBookmark} className="btn-secondary">
            {resource.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {resource.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>

          {role === 'admin' && resource.status === 'pending' && (
            <>
              <button onClick={() => moderate('approve')} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 size={16} /> Approve
              </button>
              <button onClick={() => moderate('reject')} className="btn-danger">
                <XCircle size={16} /> Reject
              </button>
            </>
          )}

          {canManage && (
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost ml-auto text-red-600 hover:bg-red-50">
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete this resource?"
        message="This permanently removes the file and its metadata. This cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-400"><Icon size={12} /> {label}</p>
      <p className="mt-0.5 font-medium text-slate-700">{value}</p>
    </div>
  );
}
