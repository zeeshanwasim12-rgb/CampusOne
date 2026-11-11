import { useMemo, useState } from 'react';
import { UserCog, Save, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { api, errMessage, absoluteUrl } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const programOptions = ['B.Tech CSE', 'B.Tech IT', 'B.Tech AI & DS', 'MCA', 'M.Tech', 'BCA', 'Other'].map((p) => ({ value: p, label: p }));
const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const roleBadge = { faculty: 'bg-purple-100 text-purple-700', admin: 'bg-brand-100 text-brand-700', student: 'bg-emerald-100 text-emerald-700' };

export default function Profile() {
  const { user, role, updateUser } = useAuth();
  const { data: departments } = useApi('/departments');
  const deptOptions = useMemo(() => (departments || []).map((d) => ({ value: d._id, label: d.name })), [departments]);

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
    program: user?.program || '',
    semester: user?.semester ? String(user.semester) : '',
    rollNumber: user?.rollNumber || '',
    subjects: (user?.subjects || []).join(', '),
    department: user?.department?._id || user?.department || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
        department: form.department || undefined,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (role === 'student') {
        payload.program = form.program;
        payload.semester = form.semester ? Number(form.semester) : undefined;
        payload.rollNumber = form.rollNumber;
      }
      const { data } = await api.patch('/users/me', payload);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMessage(err, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Profile" description="Manage your personal information and account security." icon={UserCog} />

      {/* Identity header */}
      <div className="card mb-6 flex items-center gap-4 p-5">
        <Avatar name={user?.name} src={absoluteUrl(user?.avatarUrl)} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
            <Badge className={roleBadge[role] || 'bg-slate-100 text-slate-600'}>{role}</Badge>
          </div>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={save} className="card mb-6 space-y-4 p-5">
        <h3 className="font-semibold text-slate-800">Profile details</h3>
        <Input label="Full name" value={form.name} onChange={set('name')} required />
        <Textarea label="Bio" rows={3} value={form.bio} onChange={set('bio')} placeholder="A short line about you" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="Optional" />
          <Select label="Department" placeholder="None" options={deptOptions} value={form.department} onChange={set('department')} />
        </div>

        {role === 'student' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Program" placeholder="Select" options={programOptions} value={form.program} onChange={set('program')} />
            <Select label="Semester" placeholder="Select" options={semesterOptions} value={form.semester} onChange={set('semester')} />
            <Input label="Roll number" value={form.rollNumber} onChange={set('rollNumber')} />
          </div>
        )}

        {role !== 'admin' && (
          <Input
            label="Subjects (comma separated)"
            value={form.subjects}
            onChange={set('subjects')}
            hint="Used to personalise your resource recommendations."
            placeholder="e.g. DBMS, Operating Systems, Computer Networks"
          />
        )}

        <Input label="Avatar image URL" value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://…" />

        <div className="flex justify-end">
          <Button type="submit" loading={saving}><Save size={16} /> Save changes</Button>
        </div>
      </form>

      <ChangePassword />
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errMessage(err, 'Could not change password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-slate-800"><ShieldCheck size={18} className="text-brand-600" /> Change password</h3>
      <Input label="Current password" type="password" value={form.currentPassword} onChange={set('currentPassword')} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="New password" type="password" value={form.newPassword} onChange={set('newPassword')} required />
        <Input label="Confirm new password" type="password" value={form.confirm} onChange={set('confirm')} required />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" loading={saving}><KeyRound size={16} /> Update password</Button>
      </div>
    </form>
  );
}
