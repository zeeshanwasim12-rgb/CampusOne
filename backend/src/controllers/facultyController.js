/**
 * facultyController — the Faculty Finder directory.
 * Search across name/cabin/building/subjects, filter by department.
 */
import { Faculty } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';

// GET /api/faculty?search=&department=&page=&limit=
export const listFaculty = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (department) filter.department = department;
  if (search) {
    const rx = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: rx },
      { cabinNumber: rx },
      { building: rx },
      { designation: rx },
      { subjects: rx },
    ];
  }

  const [items, total] = await Promise.all([
    Faculty.find(filter)
      .populate('department', 'name code')
      .populate('location', 'name coords building floor')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Faculty.countDocuments(filter),
  ]);

  return sendPaginated(res, items, total, { page, limit });
});

export const getFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('department', 'name code')
    .populate('location');
  if (!faculty) throw ApiError.notFound('Faculty not found');
  return sendOk(res, faculty);
});

export const createFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.create(req.body);
  return sendCreated(res, faculty, 'Faculty added');
});

export const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!faculty) throw ApiError.notFound('Faculty not found');
  return sendOk(res, faculty, 'Faculty updated');
});

export const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndDelete(req.params.id);
  if (!faculty) throw ApiError.notFound('Faculty not found');
  return sendOk(res, null, 'Faculty removed');
});

export default { listFaculty, getFaculty, createFaculty, updateFaculty, deleteFaculty };
