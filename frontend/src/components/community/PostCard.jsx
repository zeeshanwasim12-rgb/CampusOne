import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Flag, Trash2, MoreVertical, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { api, errMessage, absoluteUrl } from '../../services/api';
import { timeAgo } from '../../utils/format';

const roleBadge = {
  faculty: 'bg-purple-100 text-purple-700',
  admin: 'bg-brand-100 text-brand-700',
};

/**
 * A single community post. Works both in the feed (clamped body, links to detail)
 * and standalone. Like/report state is managed locally and optimistically.
 */
export default function PostCard({ post, onDeleted, detail = false }) {
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.likes?.length ?? 0);
  const [reported, setReported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleLike = async () => {
    // optimistic
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const { data } = await api.post(`/community/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast.error(errMessage(e));
    }
  };

  const report = async () => {
    setMenuOpen(false);
    try {
      const { data } = await api.post(`/community/posts/${post._id}/report`, { reason: '' });
      setReported(true);
      toast.success(data?.message || 'Post reported');
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const del = async () => {
    await api.delete(`/community/posts/${post._id}`);
    toast.success('Post deleted');
    onDeleted?.(post._id);
  };

  return (
    <article className="card p-5">
      <div className="flex items-start gap-3">
        <Avatar name={post.author?.name} src={absoluteUrl(post.author?.avatarUrl)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{post.author?.name || 'Unknown'}</span>
            {post.author?.role && roleBadge[post.author.role] && (
              <Badge className={roleBadge[post.author.role]}>{post.author.role}</Badge>
            )}
            <span className="text-xs text-slate-400">· {timeAgo(post.createdAt)}</span>
          </div>
          {post.category && <span className="text-xs font-medium text-brand-600">{post.category}</span>}
        </div>

        {/* actions menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {post.isMine || post.author?.role === 'admin' ? null : (
                  <button onClick={report} disabled={reported} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    <Flag size={14} /> {reported ? 'Reported' : 'Report'}
                  </button>
                )}
                {(post.isMine || onDeleted) && (
                  <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {post.isHidden && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <EyeOff size={13} /> Hidden by moderators — visible only to you and admins.
        </p>
      )}

      <div className="mt-3">
        {detail ? (
          <h1 className="text-xl font-bold text-slate-800">{post.title}</h1>
        ) : (
          <Link to={`/community/${post._id}`} className="text-lg font-semibold text-slate-800 hover:text-brand-700">
            {post.title}
          </Link>
        )}
        <p className={`mt-1 whitespace-pre-line text-sm text-slate-600 ${detail ? '' : 'line-clamp-3'}`}>{post.body}</p>
      </div>

      {post.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link key={t} to={`/community?tag=${encodeURIComponent(t)}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-200">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-sm">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 font-medium transition ${liked ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>
          <Heart size={17} className={liked ? 'fill-current' : ''} /> {likeCount}
        </button>
        <Link to={`/community/${post._id}`} className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-brand-600">
          <MessageCircle size={17} /> {post.commentCount ?? 0}
        </Link>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={del}
        title="Delete this post?"
        message="This will permanently remove the post and its comments."
        confirmText="Delete"
      />
    </article>
  );
}
