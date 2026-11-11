/**
 * Shared enums / constant values used by models, validators and controllers.
 * Keeping them here avoids magic strings scattered across the codebase.
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
});
export const ROLE_VALUES = Object.values(ROLES);

// A single Resource collection covers all academic material via this type.
export const RESOURCE_TYPES = Object.freeze({
  PYQ: 'pyq',
  ASSIGNMENT: 'assignment',
  ASSIGNMENT_GUIDE: 'assignment_guide',
  LAB_MANUAL: 'lab_manual',
  STUDY_MATERIAL: 'study_material',
});
export const RESOURCE_TYPE_VALUES = Object.values(RESOURCE_TYPES);

export const RESOURCE_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});
export const RESOURCE_STATUS_VALUES = Object.values(RESOURCE_STATUS);

export const LOCATION_TYPES = Object.freeze({
  DEPARTMENT: 'department',
  CABIN: 'cabin',
  CLASSROOM: 'classroom',
  LAB: 'lab',
  LIBRARY: 'library',
  CAFETERIA: 'cafeteria',
  OFFICE: 'office',
  FACILITY: 'facility',
});
export const LOCATION_TYPE_VALUES = Object.values(LOCATION_TYPES);

export const NOTICE_CATEGORIES = Object.freeze([
  'academic',
  'exam',
  'assignment',
  'event',
  'general',
  'placement',
]);

export const PRIORITIES = Object.freeze(['low', 'medium', 'high', 'urgent']);

export const COMMUNITY_CATEGORIES = Object.freeze([
  'General',
  'Academics',
  'DSA',
  'Web Development',
  'Cloud',
  'Events',
  'Projects',
  'Doubts',
  'Campus',
]);

export const NOTIFICATION_TYPES = Object.freeze({
  NOTICE: 'notice',
  RESOURCE: 'resource',
  ASSIGNMENT: 'assignment',
  COMMUNITY: 'community',
  EVENT: 'event',
  MESSAGE: 'message',
  SYSTEM: 'system',
});

export default {
  ROLES,
  ROLE_VALUES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_VALUES,
  RESOURCE_STATUS,
  RESOURCE_STATUS_VALUES,
  LOCATION_TYPES,
  LOCATION_TYPE_VALUES,
  NOTICE_CATEGORIES,
  PRIORITIES,
  COMMUNITY_CATEGORIES,
  NOTIFICATION_TYPES,
};
