/**
 * resourceController — the unified academic resource endpoint powering PYQs,
 * Assignments, Assignment Guides, Lab Manuals and Study Materials.
 *
 * Upload flow: multer parses the file into memory -> we validate -> storageService
 * pushes it to S3 (or local disk) -> we save ONLY metadata + storage key in Mongo.
 * Downloading returns a short-lived/streamed URL; big binaries never touch Mongo.
 */
import { Resource, Bookmark } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import * as storage from '../services/storageService.js';
import { notifyAllStudents } from '../services/notificationService.js';
import { ROLES, RESOURCE_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

/** Build the Mongo filter from query params + the requester's permissions. */
function buildFilter(query, user) {
  const filter = {};
  const { type, subject, semester, course, academicYear, department, tag, search, status } = query;

  if (type) filter.type = type;
  if (subject) filter.subject = new RegExp(`^${subject}$`, 'i');
  if (semester) filter.semester = Number(semester);
  if (course) filter.course = new RegExp(course, 'i');
  if (academicYear) filter.academicYear = academicYear;
  if (department) filter.department = department;
  if (tag) filter.tags = tag.toLowerCase();
  if (search) filter.$text = { $search: search };

  // Visibility: admins see everything (and may filter by status). Everyone else
  // sees approved resources plus anything they uploaded themselves.
  if (user?.role === ROLES.ADMIN) {
    if (status) filter.status = status;
  } else if (user) {
    filter.$or = [{ status: RESOURCE_STATUS.APPROVED }, { uploadedBy: user._id }];
  } else {
    filter.status = RESOURCE_STATUS.APPROVED;
  }
  return filter;
}

/** Annotate a list of lean resources with `isBookmarked` for the current user. */
async function withBookmarkFlags(items, user) {
  if (!user || items.length === 0) return items;
  const ids = items.map((r) => r._id);
  const marks = await Bookmark.find({ user: user._id, resource: { $in: ids } })
    .select('resource')
    .lean();
  const set = new Set(marks.map((m) => String(m.resource)));
  return items.map((r) => ({ ...r, isBookmarked: set.has(String(r._id)) }));
}

// GET /api/resources
export const listResources = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildFilter(req.query, req.user);

  const sort = req.query.sort === 'popular' ? { downloads: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Resource.find(filter)
      .populate('uploadedBy', 'name role')
      .populate('department', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Resource.countDocuments(filter),
  ]);

  const annotated = await withBookmarkFlags(items, req.user);
  return sendPaginated(res, annotated, total, { page, limit });
});

// GET /api/resources/:id  (also bumps view count)
export const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('uploadedBy', 'name role')
    .populate('department', 'name code');
  if (!resource) throw ApiError.notFound('Resource not found');
  return sendOk(res, resource);
});

// POST /api/resources  (multipart/form-data with `file`)
export const createResource = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A file is required');

  const key = storage.buildKey('resources', req.file.originalname);
  const stored = await storage.putObject({
    buffer: req.file.buffer,
    key,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  // Faculty/admin uploads are trusted and auto-approved; student uploads wait
  // for moderation so the library stays clean.
  const isTrusted = req.user.role === ROLES.FACULTY || req.user.role === ROLES.ADMIN;

  const resource = await Resource.create({
    title: req.body.title,
    description: req.body.description || '',
    type: req.body.type,
    subject: req.body.subject,
    course: req.body.course || '',
    semester: req.body.semester ? Number(req.body.semester) : undefined,
    academicYear: req.body.academicYear || '',
    department: req.body.department || undefined,
    tags: parseTags(req.body.tags),
    file: {
      ...stored,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    },
    uploadedBy: req.user._id,
    status: isTrusted ? RESOURCE_STATUS.APPROVED : RESOURCE_STATUS.PENDING,
  });

  // Broadcast trusted, immediately-visible uploads to students.
  if (isTrusted) {
    notifyAllStudents(
      {
        type: NOTIFICATION_TYPES.RESOURCE,
        title: 'New resource added',
        message: `${resource.title} (${resource.subject})`,
        link: `/resources/${resource._id}`,
      },
      { exclude: req.user._id }
    ).catch(() => {});
  }

  return sendCreated(res, resource, isTrusted ? 'Resource uploaded' : 'Uploaded — pending approval');
});

// PATCH /api/resources/:id  (owner or admin)
export const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found');
  ensureOwnerOrAdmin(resource.uploadedBy, req.user);

  const editable = ['title', 'description', 'type', 'subject', 'course', 'semester', 'academicYear', 'department'];
  editable.forEach((k) => {
    if (req.body[k] !== undefined) resource[k] = req.body[k];
  });
  if (req.body.tags !== undefined) resource.tags = parseTags(req.body.tags);
  await resource.save();

  return sendOk(res, resource, 'Resource updated');
});

// DELETE /api/resources/:id  (owner or admin)
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found');
  ensureOwnerOrAdmin(resource.uploadedBy, req.user);

  await storage.deleteObject(resource.file);
  await Bookmark.deleteMany({ resource: resource._id });
  await resource.deleteOne();

  return sendOk(res, null, 'Resource deleted');
});

// GET /api/resources/:id/download  -> { url }  (bumps download count)
export const downloadResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found');
  if (resource.status !== RESOURCE_STATUS.APPROVED && req.user.role === ROLES.STUDENT) {
    throw ApiError.forbidden('This resource is not available for download yet');
  }

  const url = await storage.getViewUrl(resource.file, { download: true });
  await Resource.updateOne({ _id: resource._id }, { $inc: { downloads: 1 } });
  return sendOk(res, { url, filename: resource.file.originalName });
});

// PATCH /api/resources/:id/moderate  (admin) -> approve/reject
export const moderateResource = asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // 'approve' | 'reject'
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw ApiError.notFound('Resource not found');

  if (action === 'approve') {
    resource.status = RESOURCE_STATUS.APPROVED;
    resource.rejectionReason = '';
  } else if (action === 'reject') {
    resource.status = RESOURCE_STATUS.REJECTED;
    resource.rejectionReason = reason || '';
  } else {
    throw ApiError.badRequest('action must be "approve" or "reject"');
  }
  await resource.save();
  return sendOk(res, resource, `Resource ${action}d`);
});

// ---- helpers ----
function ensureOwnerOrAdmin(ownerId, user) {
  if (user.role !== ROLES.ADMIN && String(ownerId) !== String(user._id)) {
    throw ApiError.forbidden('You can only modify your own resources');
  }
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  return String(tags)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export default {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  moderateResource,
};
