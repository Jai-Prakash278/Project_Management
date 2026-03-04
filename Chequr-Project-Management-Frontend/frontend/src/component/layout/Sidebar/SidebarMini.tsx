import { ChevronRight } from 'lucide-react';
import SidebarItem from './SidebarItem';
import type { SidebarMiniProps } from './types';

const SidebarMini = ({
  navItems,
  currentPath,
  userProfile,
  onNavigate,
  onToggleCollapse,
}: SidebarMiniProps) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header Section - Icon Only */}
      <div className="flex flex-col items-center px-3 py-4 border-b border-gray-200">
        {/* App Icon */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-sm mb-3">
          C
        </div>
        {/* Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 sidebar-transition text-gray-500 hover:text-gray-800"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={currentPath === item.path}
              isCollapsed={true}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </div>
      </nav>

      {/* User Profile Section - Avatar Only */}
      <div className="px-2 py-4 border-t border-gray-200">
        <button
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 sidebar-transition"
          title={userProfile.name}
        >
          {/* User Avatar */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white font-semibold text-sm">
            {userProfile.initials}
          </div>
        </button>
      </div>
    </div>
  );
};

export default SidebarMini;
