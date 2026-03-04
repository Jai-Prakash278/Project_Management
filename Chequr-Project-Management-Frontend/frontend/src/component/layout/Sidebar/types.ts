export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  path: string;
}

export interface RecentChat {
  id: string;
  title: string;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  initials: string;
  email: string;
}

export interface SidebarProps {
  className?: string;
  defaultCollapsed?: boolean;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export interface SidebarFullProps {
  navItems: NavItem[];
  currentPath: string;
  userProfile: UserProfile;
  onNavigate: (path: string) => void;
  onToggleCollapse: () => void;
  isOpen: boolean;
}

export interface SidebarMiniProps {
  navItems: NavItem[];
  currentPath: string;
  userProfile: UserProfile;
  onNavigate: (path: string) => void;
  onToggleCollapse: () => void;
  isOpen?: boolean;
}
