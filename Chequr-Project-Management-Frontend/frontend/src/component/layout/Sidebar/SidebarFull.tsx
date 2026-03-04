import { ChevronLeft, ChevronDown } from 'lucide-react';
import SidebarItem from './SidebarItem';
import ChequrLogoImg from '../../../assets/Integration Icons.svg';
import type { SidebarFullProps } from './types';

const SidebarFull = ({
  navItems,
  currentPath,
  userProfile,
  onNavigate,
  onToggleCollapse,
}: SidebarFullProps) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* App Icon/Logo */}
          <img
            src={ChequrLogoImg}
            alt="Chequr AI"
            className="w-8 h-8 rounded-full object-contain"
          />
          <span className="text-base font-semibold text-gray-800">
            Chequr AI
          </span>
        </div>
        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 sidebar-transition text-gray-500 hover:text-gray-800"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={currentPath === item.path}
              isCollapsed={false}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 sidebar-transition">
          {/* User Avatar */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white font-semibold text-sm shrink-0">
            {userProfile.initials}
          </div>
          {/* User Name */}
          <span className="flex-1 text-left text-sm font-medium text-gray-800 truncate">
            {userProfile.name}
          </span>
          {/* Dropdown Icon */}
          <ChevronDown
            size={16}
            className="shrink-0 text-gray-500"
          />
        </button>
      </div>
    </div>
  );
};

export default SidebarFull;
