import { useEffect, useMemo, useState } from 'react';
import { UserCog, Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FacultyModal from '../../components/admin/FacultyModal';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api, absoluteUrl } from '../../services/api';

export default function AdminFaculty() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useApi('/departments');
  const deptOptions = useMemo(() => (departments || []).map((d) => ({ value: d._id, label: d.name })), [departments]);

  const params = useMemo(
    () => ({ page, limit: 15, ...(debouncedSearch && { search: debouncedSearch }), ...(department && { department }) }),
    [page, debouncedSearch, department]
  );
  const { data, loading, error, pagination, refetch, setData } = useApi('/faculty', { params });

  useEffect(() => { setPage(1); }, [debouncedSearch, department]);

  const onDelete = async () => {
    await api.delete(`/faculty/${toDelete._id}`);
    toast.success('Faculty removed');
    setData((prev) => (prev || []).filter((f) => f._id !== toDelete._id));
  };

  const cabinOf = (f) => [f.cabinNumber, f.building, f.floor && `Floor ${f.floor}`].filter(Boolean).join(' · ');

  return (
    <div>
      <PageHeader
        title="Faculty Directory"
        description="Add, edit and manage the faculty cards shown in the Faculty Finder."
        icon={UserCog}
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><UserPlus size={16} /> Add faculty</button>}
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, cabin, subject or building…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="sm:w-56" placeholder="All departments" options={deptOptions} value={department} onChange={(e) => setDepartment(e.target.value)} />
      </div>

      {loading ? (
        <Spinner label="Loading faculty…" />
      ) : error ? (
        <EmptyState icon={UserCog} title="Couldn’t load faculty" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={UserCog} title="No faculty found" message="Adjust your filters or add a new faculty member." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Faculty</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Department</th>
                    <th className="px-4 py-3 font-medium">Cabin</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Office hours</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={f.name} src={absoluteUrl(f.photoUrl)} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{f.name}</p>
                            <p className="truncate text-xs text-slate-400">{f.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {f.department?.name ? <Badge className="bg-brand-50 text-brand-700">{f.department.name}</Badge> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{cabinOf(f) || '—'}</td>
                      <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{f.availability || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditing(f); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                          <button onClick={() => setToDelete(f)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <FacultyModal open={modalOpen} onClose={() => setModalOpen(false)} faculty={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title={`Remove ${toDelete?.name || 'faculty'}?`}
        message="This deletes the directory card. This cannot be undone."
        confirmText="Remove"
      />
    </div>
  );
}
