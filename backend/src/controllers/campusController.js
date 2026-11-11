/**
 * campusController — virtual campus map locations.
 * Public: list/search/get. Admin: create/update/delete.
 */
import { CampusLocation } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated } from '../utils/apiResponse.js';

// GET /api/campus?search=&type=
// Returns ALL matching locations (no pagination) because the map renders every
// pin at once. The dataset is small (campus locations), so this is fine.
export const listLocations = asyncHandler(async (req, res) => {
  const { search, type } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (search) {
    const rx = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: rx }, { building: rx }, { roomNumber: rx }, { description: rx }];
  }

  const locations = await CampusLocation.find(filter)
    .populate('department', 'name code')
    .populate('faculty', 'name cabinNumber designation')
    .sort({ type: 1, name: 1 });

  return sendOk(res, locations);
});

export const getLocation = asyncHandler(async (req, res) => {
  const location = await CampusLocation.findById(req.params.id)
    .populate('department', 'name code')
    .populate('faculty', 'name cabinNumber designation availability');
  if (!location) throw ApiError.notFound('Location not found');
  return sendOk(res, location);
});

export const createLocation = asyncHandler(async (req, res) => {
  const location = await CampusLocation.create(req.body);
  return sendCreated(res, location, 'Location added');
});

export const updateLocation = asyncHandler(async (req, res) => {
  const location = await CampusLocation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!location) throw ApiError.notFound('Location not found');
  return sendOk(res, location, 'Location updated');
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const location = await CampusLocation.findByIdAndDelete(req.params.id);
  if (!location) throw ApiError.notFound('Location not found');
  return sendOk(res, null, 'Location deleted');
});

export default { listLocations, getLocation, createLocation, updateLocation, deleteLocation };
