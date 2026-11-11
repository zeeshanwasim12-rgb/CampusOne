import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Bookmark, BookmarkCheck, Eye, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatBytes, timeAgo } from '../../utils/format';
import { resourceTypeLabel } from '../../utils/constants';
import { toggleBookmark, downloadResource } from '../../services/resources';
import { errMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-700',
};

/**
 * ResourceCard — used on resource lists, bookmarks and the dashboard.
 * `onBookmarkChange(id, bookmarked)` lets a parent react (e.g. remove from the
 * bookmarks list when un-saved).
 */
export default function ResourceCard({ resource, onBookmarkChange }) {
  const { isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(!!resource.isBookmarked);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const onToggleBookmark = async () => {
    if (!isAuthenticated) return toast.error('Sign in to bookmark resources');
    setBusy(true);
    try {
      const next = await toggleBookmark(resource._id);
      setBookmarked(next);
      onBookmarkChange?.(resource._id, next);
      toast.success(next ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadResource(resource._id);
    } catch (e) {
      toast.error(errMessage(e, 'Download failed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card flex flex-col p-5 transition hover:shadow-card-hover">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Badge className="bg-brand-50 text-brand-700">
          <FileText size={12} /> {resourceTypeLabel(resource.type)}
        </Badge>
        <div className="flex items-center gap-2">
          {resource.status && resource.status !== 'approved' && (
            <Badge className={statusStyles[resource.status]}>{resource.status}</Badge>
          )}
          <button
            onClick={onToggleBookmark}
            disabled={busy}
            className={cn('rounded-lg p-1.5 transition', bookmarked ? 'text-brand-600' : 'text-slate-300 hover:text-slate-500')}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      <Link to={`/resources/${resource._id}`} className="group">
        <h3 className="line-clamp-2 font-semibold text-slate-800 group-hover:text-brand-700">{resource.title}</h3>
      </Link>

      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500">
        <span className="font-medium text-slate-600">{resource.subject}</span>
        {resource.semester && <span>· Sem {resource.semester}</span>}
        {resource.course && <span>· {resource.course}</span>}
      </div>

      {resource.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{resource.description}</p>
      )}

      {resource.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {resource.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">#{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Download size={13} /> {resource.downloads ?? 0}</span>
          <span className="flex items-center gap-1"><Eye size={13} /> {resource.views ?? 0}</span>
          {resource.file?.size ? <span>{formatBytes(resource.file.size)}</span> : null}
        </div>
        <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(resource.createdAt)}</span>
      </div>

      <button onClick={onDownload} disabled={downloading} className="btn-primary btn-sm mt-3 w-full justify-center">
        <Download size={15} /> {downloading ? 'Preparing…' : 'Download'}
      </button>
    </div>
  );
}
