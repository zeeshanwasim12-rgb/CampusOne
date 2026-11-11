import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import ResourceCard from '../components/resources/ResourceCard';
import { useApi } from '../hooks/useApi';

export default function Bookmarks() {
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refetch, setData } = useApi('/bookmarks', { params: { page, limit: 12 } });

  // When a card is un-bookmarked, drop it from the list immediately.
  const onBookmarkChange = (id, bookmarked) => {
    if (!bookmarked) setData((prev) => (prev || []).filter((r) => r._id !== id));
  };

  return (
    <div>
      <PageHeader title="Bookmarks" description="Resources you’ve saved for later." icon={Bookmark} />

      {loading ? (
        <Spinner label="Loading bookmarks…" />
      ) : error ? (
        <EmptyState icon={Bookmark} title="Couldn’t load bookmarks" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          message="Save resources you want to revisit — they’ll show up here."
          action={<Link to="/resources" className="btn-primary"><BookOpen size={16} /> Browse resources</Link>}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <ResourceCard key={r._id} resource={r} onBookmarkChange={onBookmarkChange} />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
