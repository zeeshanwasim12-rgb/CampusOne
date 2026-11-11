import mongoose from 'mongoose';

/**
 * Faculty — the public directory entry for a teacher (used by Faculty Finder).
 *
 * This is intentionally separate from the User account: a faculty directory
 * card can exist and be searched even before that person logs in, and it
 * carries campus-specific data (cabin, timings) that doesn't belong on an
 * auth record. When a faculty member has an account, `user` links the two.
 */
const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    designation: { type: String, default: 'Assistant Professor' },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, default: '' },

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },

    // Cabin / office location
    cabinNumber: { type: String, default: '', index: true },
    building: { type: String, default: '' },
    floor: { type: String, default: '' },

    // e.g. "Mon-Fri 10:00-13:00"
    availability: { type: String, default: '' },
    subjects: [{ type: String, trim: true }],

    photoUrl: { type: String, default: '' },

    // Optional link to the campus map pin.
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusLocation' },
    // Optional link to the login account.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Helps free-text search across name / cabin / building.
facultySchema.index({ name: 'text', cabinNumber: 'text', building: 'text' });

export const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
