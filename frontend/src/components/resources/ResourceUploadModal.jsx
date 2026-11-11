import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { RESOURCE_TYPES } from '../../utils/constants';
import { uploadResource } from '../../services/resources';
import { errMessage } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const typeOptions = RESOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }));
const semesterOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

/** Modal form to upload a resource file + metadata. */
export default function ResourceUploadModal({ open, onClose, onUploaded, defaultType = 'study_material' }) {
  const { role } = useAuth();
  const { data: departments } = useApi('/departments', { enabled: open });
  const [form, setForm] = useState({
    title: '',
    type: defaultType,
    subject: '',
    course: '',
    semester: '',
    academicYear: '',
    department: '',
    tags: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose a file to upload');
    setLoading(true);
    try {
      await uploadResource(form, file);
      toast.success(
        role === 'student' ? 'Uploaded — pending admin approval' : 'Resource uploaded'
      );
      onUploaded?.();
      onClose();
    } catch (err) {
      toast.error(errMessage(err, 'Upload failed'));
    } finally {
      setLoading(false);
    }
  };

  const deptOptions = (departments || []).map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload a resource"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>Upload</Button>
        </>
      }
    >
      <form id="upload-form" onSubmit={submit} className="space-y-4">
        <Input label="Title" name="title" placeholder="e.g. DBMS Mid-Sem 2023 Question Paper" value={form.title} onChange={set('title')} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Type" name="type" options={typeOptions} value={form.type} onChange={set('type')} required />
          <Input label="Subject" name="subject" placeholder="e.g. DBMS" value={form.subject} onChange={set('subject')} required />
          <Select label="Semester" name="semester" placeholder="Any" options={semesterOptions} value={form.semester} onChange={set('semester')} />
          <Input label="Course" name="course" placeholder="e.g. B.Tech CSE" value={form.course} onChange={set('course')} />
          <Input label="Academic year" name="academicYear" placeholder="e.g. 2024-25" value={form.academicYear} onChange={set('academicYear')} />
          <Select label="Department" name="department" placeholder="None" options={deptOptions} value={form.department} onChange={set('department')} />
        </div>
        <Input label="Tags (comma separated)" name="tags" placeholder="e.g. sql, normalization, joins" value={form.tags} onChange={set('tags')} />
        <Textarea label="Description" name="description" placeholder="Optional notes about this resource" value={form.description} onChange={set('description')} />
        <div>
          <label className="label" htmlFor="file">File</label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            required
          />
          <p className="mt-1 text-xs text-slate-400">PDF, images, Office docs, or ZIP. Max ~20&nbsp;MB.</p>
        </div>
      </form>
    </Modal>
  );
}
