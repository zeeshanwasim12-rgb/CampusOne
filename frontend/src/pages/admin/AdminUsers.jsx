import { useEffect, useMemo, useState } from 'react';
import { Users, Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import UserModal from '../../components/admin/UserModal';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api, absoluteUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

const roleOptions = [
  { value: 'student', label: 'Students' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin', label: 'Admins' },
];
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];
const roleBadge = { faculty: 'bg-purple-100 text-purple-700', admin: 'bg-brand-100 text-brand-700', student: 'bg-emerald-100 text-emerald-700' };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: 15, ...(debouncedSearch && { search: debouncedSearch }), ...(role && { role }), ...(status && { status }) }),
    [page, debouncedSearch, role, status]
  );
  const { data, loading, error, pagination, refetch, setData } = useApi('/admin/users', { params });

  useEffect(() => { setPage(1); }, [debouncedSearch, role, status]);

  const onDelete = async () => {
    await api.delete(`/admin/users/${toDelete._id}`);
    toast.success('User deleted');
    setData((prev) => (prev || []).filter((u) => u._id !== toDelete._id));
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create, edit and manage student, faculty and admin accounts."
        icon={Users}
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><UserPlus size={16} /> Add user</button>}
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email or roll no…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Select className="w-36" placeholder="All roles" options={roleOptions} value={role} onChange={(e) => setRole(e.target.value)} />
          <Select className="w-36" placeholder="Any status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading users…" />
      ) : error ? (
        <EmptyState icon={Users} title="Couldn’t load users" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={Users} title="No users found" message="Adjust your filters or add a new user." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Department</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={absoluteUrl(u.avatarUrl)} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{u.name}{String(u._id) === String(me?._id) && <span className="ml-1 text-xs text-slate-400">(you)</span>}</p>
                            <p className="truncate text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className={roleBadge[u.role]}>{u.role}</Badge></td>
                      <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{u.department?.name || '—'}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className={`badge ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {u.isActive !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditing(u); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                          {String(u._id) !== String(me?._id) && (
                            <button onClick={() => setToDelete(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                          )}
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

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} user={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title={`Delete ${toDelete?.name || 'user'}?`}
        message="This permanently removes the account. This cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
