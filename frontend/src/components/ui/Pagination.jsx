import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Compact pager. Hidden when there's a single page. */
export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <p className="text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of {totalPages}
        <span className="ml-2 text-slate-400">({total} total)</span>
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary btn-sm"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          className="btn-secondary btn-sm"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
