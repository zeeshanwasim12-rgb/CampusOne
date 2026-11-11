/**
 * departmentController — CRUD for academic departments.
 * Listing is public; create/update/delete are admin-only (enforced in routes).
 */
import { Department } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated } from '../utils/apiResponse.js';

export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  return sendOk(res, departments);
});

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  return sendOk(res, department);
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  return sendCreated(res, department, 'Department created');
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) throw ApiError.notFound('Department not found');
  return sendOk(res, department, 'Department updated');
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  return sendOk(res, null, 'Department deleted');
});

export default {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
