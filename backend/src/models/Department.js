import mongoose from 'mongoose';

/**
 * Department — an academic department (CSE, IT, Mechanical, ...).
 * Referenced by users, faculty, campus locations and resources.
 */
const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true }, // e.g. "CSE"
    description: { type: String, default: '' },
    hod: { type: String, default: '' }, // head of department name
    building: { type: String, default: '' },
    floor: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
export default Department;
