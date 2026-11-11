import {
  LayoutDashboard,
  Map,
  Users,
  BookOpen,
  MessagesSquare,
  MessageCircle,
  Megaphone,
  CalendarDays,
  Bookmark,
  Bell,
  ShieldCheck,
  FolderCog,
  MapPinned,
  FileWarning,
  UserCog,
} from 'lucide-react';

/**
 * Sidebar navigation, grouped into sections. `roles` (when present) limits an
 * item to those roles; otherwise it's visible to everyone signed in.
 */
export const navSections = [
  {
    title: null,
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Campus Map', to: '/campus-map', icon: Map },
      { label: 'Faculty Finder', to: '/faculty', icon: Users },
      { label: 'Academic Resources', to: '/resources', icon: BookOpen },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Community Feed', to: '/community', icon: MessagesSquare },
      { label: 'Chat', to: '/chat', icon: MessageCircle },
      { label: 'Notices', to: '/notices', icon: Megaphone },
      { label: 'Events', to: '/events', icon: CalendarDays },
    ],
  },
  {
    title: 'Personal',
    items: [
      { label: 'Bookmarks', to: '/bookmarks', icon: Bookmark },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'Administration',
    roles: ['admin'],
    items: [
      { label: 'User Management', to: '/admin/users', icon: ShieldCheck, roles: ['admin'] },
      { label: 'Faculty Directory', to: '/admin/faculty', icon: UserCog, roles: ['admin'] },
      { label: 'Resource Approval', to: '/admin/resources', icon: FolderCog, roles: ['admin'] },
      { label: 'Campus Locations', to: '/admin/campus', icon: MapPinned, roles: ['admin'] },
      { label: 'Moderation', to: '/admin/moderation', icon: FileWarning, roles: ['admin'] },
    ],
  },
];

/** Filter the nav tree down to what a given role may see. */
export function navForRole(role) {
  return navSections
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((s) => s.items.length > 0);
}
