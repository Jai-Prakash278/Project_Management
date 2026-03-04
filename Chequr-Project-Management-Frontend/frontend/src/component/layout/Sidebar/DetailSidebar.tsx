import { ChevronUpDownIcon, PanelLeftCloseIcon, UnionIcon } from './Icons';
import ChequrLogoImg from '../../../assets/Chequr 2x.png';
import type { NavItem, UserProfile } from './types';

interface DetailSidebarProps {
    navItems: NavItem[];
    currentPath: string;
    userProfile: UserProfile;
    onNavigate: (path: string) => void;
    onToggle: () => void;
    isOpen: boolean;
}

const DetailSidebar = ({
    navItems,
    currentPath,
    userProfile,
    onNavigate,
    onToggle,
    isOpen,
    showBrandHeader = true, // Default to true for backward compatibility
}: DetailSidebarProps & { showBrandHeader?: boolean }) => {
    return (
        <div
            className={`
        flex flex-col h-full bg-[#f9fafb] border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden min-w-0
        ${isOpen ? 'w-[240px] opacity-100' : 'w-0 opacity-0'}
      `}
        >
            <div className="min-w-[240px] flex flex-col h-full"> {/* Inner container to prevent squishing */}

                {/* Header - Conditionally Rendered */}
                {showBrandHeader && (
                    <div className="h-[52px] flex items-center justify-between px-3 border-b border-gray-100">

                        {/* LEFT: logo + text */}
                        <button className="flex items-center gap-2 h-[32px]
                                        text-gray-900 font-semibold text-sm
                                        hover:bg-gray-100 px-2 rounded-lg transition-colors">

                            {/* SVG ko wrapper do */}
                            <div className="w-5 h-5 flex items-center justify-center">
                                <img
                                    src={ChequrLogoImg}
                                    alt="Chequr"
                                    className="w-full h-full block"
                                />
                            </div>

                            {/* Text ko fixed line-height */}
                            <span className="leading-[16px]">
                                Chequr
                            </span>

                            <ChevronUpDownIcon className="w-4 h-4 text-gray-400 block" />
                        </button >

                        {/* RIGHT: collapse */}
                        < button
                            onClick={onToggle}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <PanelLeftCloseIcon />
                        </button >

                    </div >
                )}



                <div className="p-4 flex-1 overflow-y-auto">
                    {/* Main CTA */}
                    <button
                        onClick={() => onNavigate('/hub')}
                        className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-white font-medium text-sm shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] mb-6
              bg-gradient-to-r from-indigo-600 to-purple-600
            `}
                    >
                        <UnionIcon className="w-4 h-4 text-white/90" />
                        Chequr AI Hub
                    </button>

                    {/* Navigation Menu */}
                    <div className="space-y-1 mb-8">
                        {navItems.filter(item => item.id !== 'hub').map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.path)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${currentPath === item.path
                                        ? 'bg-gray-200/50 text-gray-900'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}
                            >
                                <item.icon size={16} className={currentPath === item.path ? 'text-gray-900' : 'text-gray-400'} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Recent Chats - Removed per request */}
                </div>

                {/* User Footer */}
                <div className="p-3 border-t border-gray-200">
                    <button className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px]">
                            {userProfile.initials}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{userProfile.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{userProfile.email}</div>
                        </div>
                        <ChevronUpDownIcon className="text-gray-400" />
                    </button>
                </div>

            </div >
        </div >
    );
};

export default DetailSidebar;
