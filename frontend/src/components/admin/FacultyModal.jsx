import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';
import { useApi } from '../../hooks/useApi';

const DESIGNATIONS = [
  'Professor & HOD',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Visiting Faculty',
];
const designationOptions = DESIGNATIONS.map((d) => ({ value: d, label: d }));

const empty = {
  name: '', designation: 'Assistant Professor', department: '',
  email: '', phone: '',
  cabinNumber: '', building: '', floor: '',
  availability: '', subjects: '', photoUrl: '', location: '',
};

/**
 * Create/edit a Faculty directory card. Used by admins (AdminFaculty) and by
 * faculty themselves (Faculty Finder). The backend gates POST/PATCH/DELETE to
 * facultyOrAdmin; every field here maps directly onto the Faculty model.
 */
export default function FacultyModal({ open, onClose, onSaved, faculty }) {
  const isEdit = !!faculty;
  const { data: departments } = useApi('/departments', { enabled: open });
  const { data: locations } = useApi('/campus', { enabled: open });
  const deptOptions = useMemo(() => (departments || []).map((d) => ({ value: d._id, label: d.name })), [departments]);
  const locationOptions = useMemo(
    () => (locations || []).map((l) => ({ value: l._id, label: l.building ? `${l.name} · ${l.building}` : l.name })),
    [locations]
  );

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      faculty
        ? {
            name: faculty.name || '',
            designation: faculty.designation || 'Assistant Professor',
            department: faculty.department?._id || faculty.department || '',
            email: faculty.email || '',
            phone: faculty.phone || '',
            cabinNumber: faculty.cabinNumber || '',
            building: faculty.building || '',
            floor: faculty.floor || '',
            availability: faculty.availability || '',
            subjects: (faculty.subjects || []).join(', '),
            photoUrl: faculty.photoUrl || '',
            location: faculty.location?._id || faculty.location || '',
          }
        : empty
    );
  }, [open, faculty]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        designation: form.designation,
        department: form.department || undefined,
        email: form.email.trim(),
        phone: form.phone.trim(),
        cabinNumber: form.cabinNumber.trim(),
        building: form.building.trim(),
        floor: form.floor.trim(),
        availability: form.availability.trim(),
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        photoUrl: form.photoUrl.trim() || undefined,
        location: form.location || undefined,
      };
      if (isEdit) await api.patch(`/faculty/${faculty._id}`, payload);
      else await api.post('/faculty', payload);
      toast.success(isEdit ? 'Faculty updated' : 'Faculty added');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save faculty'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${faculty?.name || 'faculty'}` : 'Add faculty'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>{isEdit ? 'Save' : 'Add faculty'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={set('name')} placeholder="e.g. Dr. Meera Sharma" required />
          <Select label="Designation" options={designationOptions} value={form.designation} onChange={set('designation')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Department" placeholder="None" options={deptOptions} value={form.department} onChange={set('department')} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="name@campus.edu" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Cabin / Room" value={form.cabinNumber} onChange={set('cabinNumber')} placeholder="e.g. A-214" />
          <Input label="Building" value={form.building} onChange={set('building')} placeholder="e.g. A-Block" />
          <Input label="Floor" value={form.floor} onChange={set('floor')} placeholder="e.g. 2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="Optional" />
          <Input label="Office hours" value={form.availability} onChange={set('availability')} placeholder="e.g. Mon–Fri, 11:00–13:00" />
        </div>

        <Input
          label="Subjects (comma separated)"
          value={form.subjects}
          onChange={set('subjects')}
          placeholder="e.g. DBMS, Operating Systems"
        />

        <Select
          label="Map pin (optional)"
          placeholder="Link to a campus location — lets students jump to it on the map"
          options={locationOptions}
          value={form.location}
          onChange={set('location')}
        />

        <Input
          label="Photo URL (optional)"
          value={form.photoUrl}
          onChange={set('photoUrl')}
          placeholder="https://…/photo.jpg"
          hint="Leave blank to show initials"
        />
      </div>
    </Modal>
  );
}
