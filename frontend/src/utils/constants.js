/** Shared frontend constants: labels, options and small style maps. */

export const RESOURCE_TYPES = [
  { value: 'pyq', label: 'PYQ', plural: 'PYQs', route: '/resources/pyqs' },
  { value: 'assignment', label: 'Assignment', plural: 'Assignments', route: '/resources/assignments' },
  { value: 'assignment_guide', label: 'Assignment Guide', plural: 'Assignment Guides', route: '/resources/guides' },
  { value: 'lab_manual', label: 'Lab Manual', plural: 'Lab Manuals', route: '/resources/lab-manuals' },
  { value: 'study_material', label: 'Study Material', plural: 'Study Materials', route: '/resources/study-materials' },
];

export const resourceTypeLabel = (value) =>
  RESOURCE_TYPES.find((t) => t.value === value)?.label || value;

export const LOCATION_TYPES = [
  'department',
  'cabin',
  'classroom',
  'lab',
  'library',
  'cafeteria',
  'office',
  'facility',
];

export const COMMUNITY_CATEGORIES = [
  'General',
  'Academics',
  'DSA',
  'Web Development',
  'Cloud',
  'Events',
  'Projects',
  'Doubts',
  'Campus',
];

export const NOTICE_CATEGORIES = ['academic', 'exam', 'assignment', 'event', 'general', 'placement'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

export const categoryStyles = {
  academic: 'bg-brand-100 text-brand-700',
  exam: 'bg-purple-100 text-purple-700',
  assignment: 'bg-amber-100 text-amber-700',
  event: 'bg-emerald-100 text-emerald-700',
  general: 'bg-slate-100 text-slate-600',
  placement: 'bg-rose-100 text-rose-700',
};

export const locationTypeStyles = {
  department: 'bg-brand-100 text-brand-700',
  cabin: 'bg-purple-100 text-purple-700',
  classroom: 'bg-amber-100 text-amber-700',
  lab: 'bg-emerald-100 text-emerald-700',
  library: 'bg-indigo-100 text-indigo-700',
  cafeteria: 'bg-orange-100 text-orange-700',
  office: 'bg-slate-200 text-slate-700',
  facility: 'bg-teal-100 text-teal-700',
};
