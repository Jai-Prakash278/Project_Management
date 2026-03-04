import { AppLibraryIcon, DashboardIcon, KnowledgeCenterIcon, NotificationsIcon, TeamsIcon, UnionIcon } from './Icons';
import { ClipboardList, Folder, Kanban } from 'lucide-react';

import type { NavItem, UserProfile } from './types';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/dashboard',
  },
  // {
  //   id: 'hub',
  //   label: 'Chequr AI Hub',
  //   icon: UnionIcon,
  //   path: '/hub',
  // },
  // {
  //   id: 'app-library',
  //   label: 'App Library',
  //   icon: AppLibraryIcon,
  //   path: '/app-library',
  // },
  {
    id: 'my-issues',
    label: 'My Issues',
    icon: ClipboardList,
    path: '/my-issues',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Folder,
    path: '/projects',
  },
  {
    id: 'teams',
    label: 'Teams',
    icon: TeamsIcon,
    path: '/teams',
  },
  // {
  //   id: 'knowledge-center',
  //   label: 'Knowledge Center',
  //   icon: KnowledgeCenterIcon,
  //   path: '/knowledge-center',
  // },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationsIcon,
    path: '/notifications',
  },
];

export const PROJECT_NAV_ITEMS: NavItem[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    icon: UnionIcon,
    path: '/backlog', // Relative path to be resolved in layout
  },
  // Future items
  // { id: 'board', label: 'Board', icon: UnionIcon, path: '/board' },
];



export const USER_PROFILE: UserProfile = {
  name: 'Chaitanya V',
  initials: 'CV',
  email: 'chaitanya@chequr.ai',
};
