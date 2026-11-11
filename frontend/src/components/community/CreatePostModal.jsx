import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';
import { COMMUNITY_CATEGORIES } from '../../utils/constants';

const categoryOptions = COMMUNITY_CATEGORIES.map((c) => ({ value: c, label: c }));

/** Modal to create a new community post. Calls onCreated(post) on success. */
export default function CreatePostModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', body: '', category: 'General', tags: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and body are required');
    setLoading(true);
    try {
      const { data } = await api.post('/community/posts', {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success('Post published');
      setForm({ title: '', body: '', category: 'General', tags: '' });
      onCreated?.(data);
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not publish post'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start a discussion"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>Publish</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Title" placeholder="What do you want to discuss?" value={form.title} onChange={set('title')} maxLength={200} required />
        <Select label="Category" options={categoryOptions} value={form.category} onChange={set('category')} />
        <Textarea label="Body" rows={6} placeholder="Share details, ask a question, or start a conversation…" value={form.body} onChange={set('body')} maxLength={5000} required />
        <Input label="Tags (comma separated)" placeholder="e.g. react, placements, hackathon" value={form.tags} onChange={set('tags')} />
      </div>
    </Modal>
  );
}
