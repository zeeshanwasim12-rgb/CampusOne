import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, Plus, Pencil, Trash2, Map as MapIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LocationModal from '../../components/admin/LocationModal';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { api, errMessage } from '../../services/api';
import { LOCATION_TYPES, locationTypeStyles } from '../../utils/constants';

const typeOptions = LOCATION_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

export default function AdminCampus() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ ...(debouncedSearch && { search: debouncedSearch }), ...(type && { type }) }),
    [debouncedSearch, type]
  );
  const { data, loading, error, refetch, setData } = useApi('/campus', { params });

  const onDelete = async () => {
    try {
      await api.delete(`/campus/${toDelete._id}`);
      toast.success('Location deleted');
      setData((prev) => (prev || []).filter((l) => l._id !== toDelete._id));
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Campus Locations"
        description="Manage the pins shown on the virtual campus map."
        icon={MapPin}
        actions={
          <div className="flex gap-2">
            <Link to="/campus-map" className="btn-secondary"><MapIcon size={16} /> View map</Link>
            <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add location</button>
          </div>
        }
      />

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, building or room…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-44" placeholder="All types" options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
      </div>

      {loading ? (
        <Spinner label="Loading locations…" />
      ) : error ? (
        <EmptyState icon={MapPin} title="Couldn’t load locations" message={error} action={<button className="btn-secondary" onClick={refetch}>Retry</button>} />
      ) : !data?.length ? (
        <EmptyState icon={MapPin} title="No locations yet" message="Add your first campus location to place it on the map." action={<button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add location</button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Building / Room</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Department</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Map (x, y)</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.name}</p>
                      {l.description && <p className="max-w-xs truncate text-xs text-slate-400">{l.description}</p>}
                    </td>
                    <td className="px-4 py-3"><Badge className={locationTypeStyles[l.type] || 'bg-slate-100 text-slate-600'}>{l.type}</Badge></td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {[l.building, l.roomNumber].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{l.department?.name || '—'}</td>
                    <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{l.coords ? `${l.coords.x}, ${l.coords.y}` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/campus-map?focus=${l._id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" title="Show on map"><MapPin size={15} /></Link>
                        <button onClick={() => { setEditing(l); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                        <button onClick={() => setToDelete(l)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LocationModal open={modalOpen} onClose={() => setModalOpen(false)} location={editing} onSaved={refetch} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title={`Delete ${toDelete?.name || 'location'}?`}
        message="This removes the pin from the campus map."
        confirmText="Delete"
      />
    </div>
  );
}
