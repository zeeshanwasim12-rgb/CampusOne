import { useMemo, useState } from 'react';
import { BookOpen, Upload, Search, SlidersHorizontal } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import ResourceCard from '../../components/resources/ResourceCard';
import ResourceUploadModal from '../../components/resources/ResourceUploadModal';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { RESOURCE_TYPES } from '../../utils/constants';

const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Sem ${i + 1}` }));
const sortOptions = [
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most downloaded' },
];

/** Typed resource listing (PYQs, Assignments, Guides, Lab Manuals, Study Materials). */
export default function ResourceList({ type }) {
  const meta = RESOURCE_TYPES.find((t) => t.value === type);
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ type, page, limit: 12, sort, ...(debouncedSearch && { search: debouncedSearch }), ...(semester && { semester }) }),
    [type, page, sort, debouncedSearch, semester]
  );

  const { data, loading, error, pagination, refetch } = useApi('/resources', { params });

  return (
    <div>
      <PageHeader
        title={meta?.plural || 'Resources'}
        description={`Browse and download ${meta?.plural?.toLowerCase() || 'resources'} shared across the campus.`}
        icon={BookOpen}
        actions={
          <button className="btn-primary" onClick={() => setUploadOpen(true)}>
            <Upload size={16} /> Upload
          </button>
        }
      />

      {/* Filters */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by title, subject or tag…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-3">
          <Select className="w-36" placeholder="All semesters" options={semesterOptions} value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1); }} />
          <Select className="w-44" options={sortOptions} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading resources…" />
      ) : error ? (
        <EmptyState icon={SlidersHorizontal} title="Couldn’t load resources" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState
          icon={BookOpen}
          title={`No ${meta?.plural?.toLowerCase() || 'resources'} yet`}
          message="Be the first to contribute — upload a resource for your peers."
          action={<button className="btn-primary" onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload</button>}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <ResourceCard key={r._id} resource={r} />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <ResourceUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultType={type}
        onUploaded={refetch}
      />
    </div>
  );
}
