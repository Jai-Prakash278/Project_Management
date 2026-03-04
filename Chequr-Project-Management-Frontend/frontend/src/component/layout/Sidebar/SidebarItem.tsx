import type { SidebarItemProps } from './types';
import clsx from 'clsx';

const SidebarItem = ({ item, isActive, isCollapsed, onClick }: SidebarItemProps) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center w-full rounded-lg sidebar-transition',
        'hover:bg-gray-100',
        isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3 gap-3',
        isActive
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'text-gray-800 hover:text-gray-900'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon
        className="shrink-0"
        size={20}
      />
      {!isCollapsed && (
        <span className="text-sm font-medium">{item.label}</span>
      )}
    </button>
  );
};

export default SidebarItem;
