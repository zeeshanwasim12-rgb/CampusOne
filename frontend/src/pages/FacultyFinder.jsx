import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Mail, Phone, MapPin, Clock, DoorClosed, BookOpen, UserPlus, Pencil } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import FacultyModal from '../components/admin/FacultyModal';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { absoluteUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FacultyFinder() {
  const { user } = useAuth();
  const canManage = user?.role === 'faculty' || user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useApi('/departments');
  const deptOptions = useMemo(
    () => (departments || []).map((d) => ({ value: d._id, label: d.name })),
    [departments]
  );

  const params = useMemo(
    () => ({ page, limit: 12, ...(debouncedSearch && { search: debouncedSearch }), ...(department && { department }) }),
    [page, debouncedSearch, department]
  );
  const { data, loading, error, pagination, refetch } = useApi('/faculty', { params });

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (f) => { setEditing(f); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title="Faculty Finder"
        description="Locate teachers, their cabins and office hours across campus."
        icon={Users}
        actions={canManage && <button className="btn-primary" onClick={openAdd}><UserPlus size={16} /> Add faculty</button>}
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, cabin, subject or building…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          className="sm:w-56"
          placeholder="All departments"
          options={deptOptions}
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <Spinner label="Loading faculty…" />
      ) : error ? (
        <EmptyState icon={Users} title="Couldn’t load faculty" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState
          icon={Users}
          title="No faculty found"
          message={canManage ? 'Try a different search, or add a faculty member.' : 'Try a different search term or department filter.'}
          action={canManage && <button className="btn-primary" onClick={openAdd}><UserPlus size={16} /> Add faculty</button>}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((f) => (
              <FacultyCard key={f._id} faculty={f} canManage={canManage} onEdit={() => openEdit(f)} />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <FacultyModal open={modalOpen} onClose={() => setModalOpen(false)} faculty={editing} onSaved={refetch} />
    </div>
  );
}

function FacultyCard({ faculty: f, canManage, onEdit }) {
  const cabin = [f.cabinNumber, f.building, f.floor && `Floor ${f.floor}`].filter(Boolean).join(' · ');
  return (
    <div className="card relative flex flex-col p-5">
      {canManage && (
        <button
          onClick={onEdit}
          title="Edit this card"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
        >
          <Pencil size={15} />
        </button>
      )}
      <div className="flex items-center gap-3">
        <Avatar name={f.name} src={absoluteUrl(f.photoUrl)} size="lg" />
        <div className="min-w-0 pr-6">
          <h3 className="truncate font-semibold text-slate-800">{f.name}</h3>
          <p className="truncate text-sm text-slate-500">{f.designation}</p>
          {f.department?.name && <Badge className="mt-1 bg-brand-50 text-brand-700">{f.department.name}</Badge>}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {cabin && <Row icon={DoorClosed}>{cabin}</Row>}
        {f.availability && <Row icon={Clock}>{f.availability}</Row>}
        {f.subjects?.length > 0 && <Row icon={BookOpen}>{f.subjects.slice(0, 3).join(', ')}{f.subjects.length > 3 ? '…' : ''}</Row>}
        {f.email && <Row icon={Mail}><a href={`mailto:${f.email}`} className="text-brand-600 hover:underline">{f.email}</a></Row>}
        {f.phone && <Row icon={Phone}>{f.phone}</Row>}
      </div>

      {f.location?._id && (
        <Link to={`/campus-map?focus=${f.location._id}`} className="btn-secondary mt-4 w-full justify-center">
          <MapPin size={16} /> Locate on map
        </Link>
      )}
    </div>
  );
}

function Row({ icon: Icon, children }) {
  return (
    <p className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
