import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users2, Search, PenSquare, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { COMMUNITY_CATEGORIES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function Community() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get('tag') || '';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      sort,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(category && { category }),
      ...(tag && { tag }),
    }),
    [page, sort, debouncedSearch, category, tag]
  );
  const { data, loading, error, pagination, refetch, setData } = useApi('/community/posts', { params });

  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1); }, [debouncedSearch, category, sort, tag]);

  const onDeleted = (id) => setData((prev) => (prev || []).filter((p) => p._id !== id));

  return (
    <div>
      <PageHeader
        title="Community"
        description="Ask questions, share updates and connect with students and faculty."
        icon={Users2}
        actions={
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <PenSquare size={16} /> New post
          </button>
        }
      />

      {/* Filters */}
      <div className="card mb-6 space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {['recent', 'top'].map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${sort === s ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={!category} onClick={() => setCategory('')}>All</Chip>
          {COMMUNITY_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)}>{c}</Chip>
          ))}
        </div>

        {tag && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Filtering by tag:
            <span className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
              #{tag}
              <button onClick={() => setSearchParams({}, { replace: true })}><X size={13} /></button>
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading posts…" />
      ) : error ? (
        <EmptyState icon={Users2} title="Couldn’t load posts" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState
          icon={Users2}
          title="No posts yet"
          message="Be the first to start a discussion in the community."
          action={<button className="btn-primary" onClick={() => setCreateOpen(true)}><PenSquare size={16} /> New post</button>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.map((p) => (
              <PostCard key={p._id} post={p} onDeleted={role === 'admin' || p.isMine ? onDeleted : undefined} />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  );
}
