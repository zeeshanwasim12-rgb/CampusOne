import mongoose from 'mongoose';
import { LOCATION_TYPE_VALUES } from '../utils/constants.js';

/**
 * CampusLocation — a single point on the virtual campus map.
 *
 * `coords` are stored as { x, y } percentages (0-100) relative to the campus
 * map image, so the interactive map works with NO external map provider. If a
 * real geo map is used later, `geo` (lat/lng) can be populated too.
 */
const campusLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    type: { type: String, enum: LOCATION_TYPE_VALUES, required: true, index: true },
    description: { type: String, default: '' },

    building: { type: String, default: '' },
    floor: { type: String, default: '' },
    roomNumber: { type: String, default: '' },

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },

    // Position on the campus map image (percent-based, provider-independent).
    coords: {
      x: { type: Number, min: 0, max: 100, default: 50 },
      y: { type: Number, min: 0, max: 100, default: 50 },
    },
    // Optional real-world coordinates (Google Maps / Leaflet OSM).
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },

    amenities: [{ type: String }], // e.g. ["Projector", "AC"]
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

campusLocationSchema.index({ name: 'text', building: 'text', roomNumber: 'text' });

export const CampusLocation = mongoose.model('CampusLocation', campusLocationSchema);
export default CampusLocation;
