import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PostCard from '../../components/community/PostCard';
import { useApi } from '../../hooks/useApi';
import { api, errMessage, absoluteUrl } from '../../services/api';
import { timeAgo } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

const roleBadge = { faculty: 'bg-purple-100 text-purple-700', admin: 'bg-brand-100 text-brand-700' };

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: post, loading, error } = useApi(`/community/posts/${id}`);
  const { data: comments, loading: commentsLoading, setData: setComments } = useApi(`/community/posts/${id}/comments`);

  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/community/posts/${id}/comments`, { body });
      setComments((prev) => [...(prev || []), data]);
      setBody('');
    } catch (err) {
      toast.error(errMessage(err, 'Could not add comment'));
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/community/posts/${id}/comments/${commentId}`);
      setComments((prev) => (prev || []).filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(errMessage(err));
    }
  };

  if (loading) return <Spinner fullPage label="Loading post…" />;
  if (error || !post) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Post not found"
        message={error || 'This post may have been removed.'}
        action={<Link to="/community" className="btn-primary">Back to community</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <PostCard post={post} detail onDeleted={() => navigate('/community')} />

      {/* Comments */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          {comments?.length || 0} {comments?.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        <form onSubmit={submit} className="card mb-4 flex items-start gap-3 p-4">
          <Avatar name={user?.name} src={absoluteUrl(user?.avatarUrl)} size="sm" />
          <div className="flex-1">
            <textarea
              className="input min-h-[68px] resize-y"
              placeholder="Add a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" loading={posting} disabled={!body.trim()}>
                <Send size={14} /> Comment
              </Button>
            </div>
          </div>
        </form>

        {commentsLoading ? (
          <Spinner />
        ) : !comments?.length ? (
          <p className="py-6 text-center text-sm text-slate-400">No comments yet — be the first to reply.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const mine = String(c.author?._id) === String(user?._id);
              return (
                <div key={c._id} className="card flex items-start gap-3 p-4">
                  <Avatar name={c.author?.name} src={absoluteUrl(c.author?.avatarUrl)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{c.author?.name || 'Unknown'}</span>
                      {c.author?.role && roleBadge[c.author.role] && <Badge className={roleBadge[c.author.role]}>{c.author.role}</Badge>}
                      <span className="text-xs text-slate-400">· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{c.body}</p>
                  </div>
                  {(mine || role === 'admin') && (
                    <button onClick={() => deleteComment(c._id)} className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
