import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';
import { useApi } from '../../hooks/useApi';

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin', label: 'Admin' },
];
const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const empty = { name: '', email: '', password: '', role: 'student', program: '', semester: '', rollNumber: '', department: '', isActive: true };

/** Admin create/edit user. Create requires a password; edit updates role/status/profile. */
export default function UserModal({ open, onClose, onSaved, user }) {
  const isEdit = !!user;
  const { data: departments } = useApi('/departments', { enabled: open });
  const deptOptions = useMemo(() => (departments || []).map((d) => ({ value: d._id, label: d.name })), [departments]);

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        user
          ? {
              name: user.name || '',
              email: user.email || '',
              password: '',
              role: user.role || 'student',
              program: user.program || '',
              semester: user.semester ? String(user.semester) : '',
              rollNumber: user.rollNumber || '',
              department: user.department?._id || user.department || '',
              isActive: user.isActive !== false,
            }
          : empty
      );
    }
  }, [open, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!isEdit && (!form.email.trim() || form.password.length < 6)) return toast.error('Email and a 6+ char password are required');
    setLoading(true);
    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          role: form.role,
          isActive: form.isActive,
          department: form.department || undefined,
        };
        if (form.role === 'student') {
          payload.program = form.program;
          payload.semester = form.semester ? Number(form.semester) : undefined;
          payload.rollNumber = form.rollNumber;
        }
        const { data } = await api.patch(`/admin/users/${user._id}`, payload);
        toast.success('User updated');
        onSaved?.(data);
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department || undefined,
        };
        if (form.role === 'student') {
          payload.program = form.program;
          payload.semester = form.semester ? Number(form.semester) : undefined;
        }
        const { data } = await api.post('/admin/users', payload);
        toast.success('User created');
        onSaved?.(data);
      }
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${user?.name || 'user'}` : 'Create user'}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>{isEdit ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Full name" value={form.name} onChange={set('name')} required />
        {!isEdit && (
          <>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Temporary password" type="password" value={form.password} onChange={set('password')} hint="Minimum 6 characters" required />
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Role" options={roleOptions} value={form.role} onChange={set('role')} />
          <Select label="Department" placeholder="None" options={deptOptions} value={form.department} onChange={set('department')} />
        </div>

        {form.role === 'student' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Program" value={form.program} onChange={set('program')} placeholder="e.g. B.Tech CSE" />
            <Select label="Semester" placeholder="Select" options={semesterOptions} value={form.semester} onChange={set('semester')} />
            {isEdit && <Input label="Roll number" value={form.rollNumber} onChange={set('rollNumber')} />}
          </div>
        )}

        {isEdit && (
          <Select
            label="Account status"
            options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Disabled' }]}
            value={String(form.isActive)}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
          />
        )}
      </div>
    </Modal>
  );
}
