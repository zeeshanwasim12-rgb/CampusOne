import mongoose from 'mongoose';

/**
 * Event — campus/academic events with a start time and optional registration.
 */
const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, default: '' },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date },

    location: { type: String, default: '' }, // free text (e.g. "Auditorium, A-Block")
    organizer: { type: String, default: '' },
    category: { type: String, default: 'General' }, // Technical, Cultural, Sports, ...

    registrationUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ name: 'text', description: 'text' });

// Virtual convenience flag for the frontend.
eventSchema.virtual('isPast').get(function isPast() {
  return this.startAt ? this.startAt.getTime() < Date.now() : false;
});
eventSchema.set('toJSON', { virtuals: true });

export const Event = mongoose.model('Event', eventSchema);
export default Event;
