import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LOCATION_TYPES } from '../../utils/constants';

const typeOptions = LOCATION_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

const empty = {
  name: '', type: 'classroom', description: '',
  building: '', floor: '', roomNumber: '',
  department: '', x: 50, y: 50, lat: '', lng: '', amenities: '',
};

/** Admin create/edit for a campus map location. Coords are map percentages (0–100). */
export default function LocationModal({ open, onClose, onSaved, location }) {
  const isEdit = !!location;
  const { data: departments } = useApi('/departments', { enabled: open });
  const deptOptions = useMemo(() => (departments || []).map((d) => ({ value: d._id, label: d.name })), [departments]);

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      location
        ? {
            name: location.name || '',
            type: location.type || 'classroom',
            description: location.description || '',
            building: location.building || '',
            floor: location.floor || '',
            roomNumber: location.roomNumber || '',
            department: location.department?._id || location.department || '',
            x: location.coords?.x ?? 50,
            y: location.coords?.y ?? 50,
            lat: location.geo?.lat ?? '',
            lng: location.geo?.lng ?? '',
            amenities: (location.amenities || []).join(', '),
          }
        : empty
    );
  }, [open, location]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description,
        building: form.building,
        floor: form.floor,
        roomNumber: form.roomNumber,
        department: form.department || undefined,
        coords: { x: Number(form.x) || 0, y: Number(form.y) || 0 },
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (form.lat !== '' && form.lng !== '') {
        payload.geo = { lat: Number(form.lat), lng: Number(form.lng) };
      }
      if (isEdit) await api.patch(`/campus/${location._id}`, payload);
      else await api.post('/campus', payload);
      toast.success(isEdit ? 'Location updated' : 'Location added');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save location'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${location?.name || 'location'}` : 'Add campus location'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>{isEdit ? 'Save' : 'Add location'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={set('name')} placeholder="e.g. Seminar Hall A" required />
          <Select label="Type" options={typeOptions} value={form.type} onChange={set('type')} />
        </div>

        <Textarea label="Description" rows={2} value={form.description} onChange={set('description')} placeholder="Short description shown on the map" />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Building" value={form.building} onChange={set('building')} placeholder="e.g. Block C" />
          <Input label="Floor" value={form.floor} onChange={set('floor')} placeholder="e.g. 2nd" />
          <Input label="Room number" value={form.roomNumber} onChange={set('roomNumber')} placeholder="e.g. C-204" />
        </div>

        <Select label="Department" placeholder="None" options={deptOptions} value={form.department} onChange={set('department')} />

        <div>
          <p className="label">Map position (percent of map, 0–100)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" min="0" max="100" value={form.x} onChange={set('x')} hint="Horizontal — X" />
            <Input type="number" min="0" max="100" value={form.y} onChange={set('y')} hint="Vertical — Y" />
          </div>
        </div>

        <Input
          label="Amenities (comma separated)"
          value={form.amenities}
          onChange={set('amenities')}
          placeholder="e.g. Projector, AC, Smart board"
        />

        <div>
          <p className="label">Real-world coordinates (optional — enables “Open in Google Maps”)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="Latitude" />
            <Input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="Longitude" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
