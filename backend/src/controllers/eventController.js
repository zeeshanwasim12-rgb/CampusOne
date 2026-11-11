/**
 * eventController — campus events with upcoming/past filtering and RSVP.
 */
import { Event } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { notifyAllStudents } from '../services/notificationService.js';
import { ROLES, NOTIFICATION_TYPES } from '../utils/constants.js';

// GET /api/events?filter=upcoming|past&search=
export const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { filter: when, search, category } = req.query;

  const filter = { isActive: true };
  const now = new Date();
  if (when === 'upcoming') filter.startAt = { $gte: now };
  if (when === 'past') filter.startAt = { $lt: now };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const sort = when === 'past' ? { startAt: -1 } : { startAt: 1 };

  const [items, total] = await Promise.all([
    Event.find(filter).populate('createdBy', 'name role').sort(sort).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  return sendPaginated(res, items, total, { page, limit });
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('createdBy', 'name role');
  if (!event) throw ApiError.notFound('Event not found');
  return sendOk(res, event);
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });

  notifyAllStudents(
    {
      type: NOTIFICATION_TYPES.EVENT,
      title: `New event: ${event.name}`,
      message: event.location || '',
      link: '/events',
    },
    { exclude: req.user._id }
  ).catch(() => {});

  return sendCreated(res, event, 'Event created');
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (req.user.role !== ROLES.ADMIN && String(event.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit your own events');
  }
  Object.assign(event, req.body);
  await event.save();
  return sendOk(res, event, 'Event updated');
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (req.user.role !== ROLES.ADMIN && String(event.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own events');
  }
  await event.deleteOne();
  return sendOk(res, null, 'Event deleted');
});

// POST /api/events/:id/register  — toggle RSVP for the current user
export const toggleRegister = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');

  const id = String(req.user._id);
  const idx = event.attendees.findIndex((a) => String(a) === id);
  let registered;
  if (idx >= 0) {
    event.attendees.splice(idx, 1);
    registered = false;
  } else {
    event.attendees.push(req.user._id);
    registered = true;
  }
  await event.save();
  return sendOk(res, { registered, attendees: event.attendees.length }, registered ? 'Registered' : 'Registration cancelled');
});

export default {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleRegister,
};
