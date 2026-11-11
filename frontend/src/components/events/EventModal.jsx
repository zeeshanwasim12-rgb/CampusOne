import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api, errMessage } from '../../services/api';

const EVENT_CATEGORIES = ['Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Webinar', 'Fest', 'Placement', 'Other'];
const categoryOptions = EVENT_CATEGORIES.map((c) => ({ value: c, label: c }));

// ISO string -> value for <input type="datetime-local"> in local time.
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

const empty = { name: '', description: '', category: 'Workshop', startAt: '', endAt: '', location: '', organizer: '', registrationUrl: '', bannerUrl: '' };

/** Create or edit a campus event (faculty/admin). */
export default function EventModal({ open, onClose, onSaved, event }) {
  const isEdit = !!event;
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        event
          ? {
              name: event.name || '',
              description: event.description || '',
              category: event.category || 'Workshop',
              startAt: toLocalInput(event.startAt),
              endAt: toLocalInput(event.endAt),
              location: event.location || '',
              organizer: event.organizer || '',
              registrationUrl: event.registrationUrl || '',
              bannerUrl: event.bannerUrl || '',
            }
          : empty
      );
    }
  }, [open, event]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.startAt) return toast.error('Name and start date/time are required');
    const payload = {
      ...form,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
    };
    setLoading(true);
    try {
      const { data } = isEdit
        ? await api.patch(`/events/${event._id}`, payload)
        : await api.post('/events', payload);
      toast.success(isEdit ? 'Event updated' : 'Event created');
      onSaved?.(data);
      onClose();
    } catch (e) {
      toast.error(errMessage(e, 'Could not save event'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event' : 'Create an event'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={submit} loading={loading}>{isEdit ? 'Save changes' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Event name" value={form.name} onChange={set('name')} placeholder="e.g. CloudFest 2026" required />
        <Textarea label="Description" rows={4} value={form.description} onChange={set('description')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Starts" type="datetime-local" value={form.startAt} onChange={set('startAt')} required />
          <Input label="Ends (optional)" type="datetime-local" value={form.endAt} onChange={set('endAt')} />
          <Select label="Category" options={categoryOptions} value={form.category} onChange={set('category')} />
          <Input label="Location" value={form.location} onChange={set('location')} placeholder="e.g. Main Auditorium" />
          <Input label="Organizer" value={form.organizer} onChange={set('organizer')} placeholder="e.g. Cloud Club" />
          <Input label="Registration link" value={form.registrationUrl} onChange={set('registrationUrl')} placeholder="https://…" />
        </div>
        <Input label="Banner image URL (optional)" value={form.bannerUrl} onChange={set('bannerUrl')} placeholder="https://…" />
      </div>
    </Modal>
  );
}
