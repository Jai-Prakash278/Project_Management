import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChequrLogo from './ChequrLogo';
import type { NavItem, UserProfile } from './types';

interface IconRailProps {
    navItems: NavItem[];
    currentPath: string;
    userProfile: UserProfile;
    onNavigate: (path: string) => void;
    onToggleDetail: () => void;
    isDetailOpen: boolean;
}

const IconRail = ({
    navItems,
    currentPath,
    userProfile,
    onNavigate,
    onToggleDetail,
    isDetailOpen,
}: IconRailProps) => {
    return (
        <div className={`flex flex-col items-center h-full w-[60px] py-3 bg-white ${isDetailOpen ? '' : 'border-r border-gray-200'} z-20 relative`}>
            <div className="mb-4">
                <ChequrLogo className="w-8 h-8 drop-shadow-md" />
            </div>

            {/* Sidebar Toggle */}
            <button
                onClick={onToggleDetail}
                className="mb-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
                {isDetailOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col gap-4 w-full px-2">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path;
                    const isHub = item.id === 'hub';

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`
                group relative flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-200
                ${isActive
                                    ? isHub
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                        : 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                }
              `}
                            title={item.label}
                        >
                            <item.icon
                                size={20}
                                className={`
                  transition-transform duration-200 group-hover:scale-110 
                  ${isActive && isHub ? 'stroke-current' : ''}
                `}
                            />

                            {/* Active Indicator Dot for non-Hub items */}
                            {isActive && !isHub && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* User Avatar */}
            <div className="mt-auto px-2">
                <button
                    className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-xs ring-2 ring-white ring-offset-2 ring-offset-gray-100"
                    title={userProfile.name}
                >
                    {userProfile.initials}
                </button>
            </div>
        </div>
    );
};

export default IconRail;
