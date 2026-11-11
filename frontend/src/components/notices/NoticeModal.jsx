import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { NOTICE_CATEGORIES, PRIORITIES } from '../../utils/constants';

const categoryOptions = NOTICE_CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }));
const priorityOptions = PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }));

const empty = { title: '', description: '', category: 'general', priority: 'medium', department: '', dueDate: '', isPinned: false };

/** Create or edit a notice. Create supports an optional file attachment (multipart). */
export default function NoticeModal({ open, onClose, onSaved, notice }) {
  const isEdit = !!notice;
  const { data: departments } = useApi('/departments', { enabled: open });
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        notice
          ? {
              title: notice.title || '',
              description: notice.description || '',
              category: notice.category || 'general',
              priority: notice.priority || 'medium',
              department: notice.department?._id || notice.department || '',
              dueDate: notice.dueDate ? notice.dueDate.slice(0, 10) : '',
              isPinned: !!notice.isPinned,
            }
          : empty
      );
      setFile(null);
    }
  }, [open, notice]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const deptOptions = (departments || []).map((d) => ({ value: d._id, label: d.name }));

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description are required');
    setLoading(true);
    try {
      if (isEdit) {
        const { data } = await api.patch(`/notices/${notice._id}`, {
          ...form,
          department: form.department || undefined,
          dueDate: form.dueDate || undefined,
        });
        toast.success('Notice updated');
        onSaved?.(data);
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v !== '' && v != null && fd.append(k, v));
        if (file) fd.append('attachment', file);
        const { data } = await api.post('/notices', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Notice published');
        onSaved?.(data);
      }
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save notice'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit notice' : 'Publish a notice'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>{isEdit ? 'Save changes' : 'Publish'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title" value={form.title} onChange={set('title')} placeholder="e.g. Mid-sem exam schedule released" required />
        <Textarea label="Description" rows={5} value={form.description} onChange={set('description')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" options={categoryOptions} value={form.category} onChange={set('category')} />
          <Select label="Priority" options={priorityOptions} value={form.priority} onChange={set('priority')} />
          <Select label="Department" placeholder="All departments" options={deptOptions} value={form.department} onChange={set('department')} />
          <Input label="Due date (optional)" type="date" value={form.dueDate} onChange={set('dueDate')} />
        </div>

        {!isEdit && (
          <div>
            <label className="label" htmlFor="notice-file">Attachment (optional)</label>
            <input
              id="notice-file"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
          Pin this notice to the top
        </label>
      </div>
    </Modal>
  );
}
