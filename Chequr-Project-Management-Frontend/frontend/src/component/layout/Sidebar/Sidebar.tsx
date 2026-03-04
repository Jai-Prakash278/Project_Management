import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronUpDownIcon, PanelLeftCloseIcon } from './Icons';
import ChequrLogoImg from '../../../assets/Chequr icon.svg';
import { NAV_ITEMS, USER_PROFILE } from './constants';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../redux/store';
import { logout } from '../../../redux/slices/authSlice';
import { LOGOUT_MUTATION } from '../../../graphql/auth.mutation';
import { useMutation, useQuery, useApolloClient } from '@apollo/client/react';
import { GET_USER_PROFILE } from '../../../graphql/user.query';
import UserProfileModal from '../../UserProfileModal';

interface UserProfileData {
  user: {
    firstName?: string;
    lastName?: string;
  };
}

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false); // New state
  const navigate = useNavigate();
  const location = useLocation();
  const client = useApolloClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  // Use optional chaining carefully
  const userId = user?.id || '';
  console.log('Sidebar userId:', userId, 'User object:', user);

  // Fetch detailed user profile to get the name
  // We use the query here to avoid modifying the critical Login flow
  // This is safe as it re-uses the existing profile query logic
  const { data: profileData } = useQuery<UserProfileData>(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId,
  });

  const profileUser = profileData?.user;

  // Derive name and initials from profile data (first priority) or user object (fallback) or email
  // derive user name
  let userName = USER_PROFILE.name;
  if (profileUser?.firstName && profileUser?.lastName) {
    userName = `${profileUser.firstName} ${profileUser.lastName}`;
  } else if (user?.email) {
    const parts = user.email.split('@');
    if (parts.length > 0) {
      userName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  const userInitials = (profileUser?.firstName && profileUser?.lastName)
    ? `${profileUser.firstName.charAt(0)}${profileUser.lastName.charAt(0)}`.toUpperCase()
    : user?.email
      ? user.email.substring(0, 2).toUpperCase()
      : USER_PROFILE.initials;

  const userEmail = user?.email || USER_PROFILE.email;

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleNavigate = (path: string) => {
    if (path === '#') return;
    navigate(path);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false); // Close dropdown
    setIsUserModalOpen(true); // Open modal
  };

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out z-50
        ${isExpanded ? 'w-[260px]' : 'w-[72px]'}
      `}
    >
      {/* Header Section */}
      <div className="flex flex-col mb-2">
        {/* ... (Logo logic unchanged) */}
        {isExpanded && (
          <div className="flex items-center h-[64px] px-4">
            <div className="flex items-center gap-2">
              <img
                src={ChequrLogoImg}
                alt="Chequr"
                className="w-8 h-8 shrink-0 rounded-md"
              />

              {/* Title */}
              <div
                className="flex items-center gap-2 font-semibold text-gray-900 whitespace-nowrap overflow-hidden transition-all duration-300 w-auto opacity-100"
              >
                <span className="text-sm">Chequr</span>
                <div className="flex flex-col gap-[2px]">
                  <ChevronUpDownIcon className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className={`flex ${isExpanded ? 'absolute right-3 top-4' : 'justify-center w-full h-[64px] items-center'}`}>
          <button
            onClick={handleToggle}
            className={`
                p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors
                ${!isExpanded && 'mt-0'}
              `}
          >
            {isExpanded ? (
              <PanelLeftCloseIcon />
            ) : (
              <PanelLeftCloseIcon />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p px-3 space-y-2">
        {NAV_ITEMS.filter(item => {
          if (item.id === 'teams') {
            const roles = user?.roles || [];
            return roles.some((role: any) => {
              const roleKey = typeof role === 'string' ? role : (role.role?.key || role.key);
              return roleKey === 'ADMIN';
            });
          }
          return true;
        }).map((item) => {
          const isActive = location.pathname === item.path;
          const isHub = item.id === 'hub';

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              title={!isExpanded ? item.label : ''}
              className={`
                  relative flex items-center w-full transition-all duration-200 group
                  ${isExpanded ? 'h-10 px-3 rounded-lg' : 'h-12 justify-center rounded-xl aspect-square'}
                  ${isHub
                  ? isExpanded
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:scale-[1.02]'
                    : isActive ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                  : isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }
                  ${!isExpanded && isHub && !isActive && 'text-purple-600 bg-purple-50'}
                `}
            >
              {/* Icon */}
              <item.icon
                size={isExpanded ? 18 : 22}
                className={`
                      shrink-0 transition-all duration-200
                      ${isExpanded ? 'mr-3' : ''}
                      ${isHub && !isExpanded && isActive ? 'text-white' : ''}
                    `}
              />

              {/* Label - Sliding reveal */}
              <span
                className={`
                      whitespace-nowrap overflow-hidden transition-all duration-300 font-medium text-sm
                      ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}
                    `}
              >
                {item.label}
              </span>

              {/* Hub Sparkles Effect (optional) */}
              {isHub && isExpanded && (
                <></>
              )}

              {/* Active Indicator for Mini Sidebar (Non-Hub) */}
              {!isExpanded && isActive && !isHub && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-gray-200 p-3 relative group">

        {/* Dropdown Menu */}
        {isProfileOpen && (
          <div
            className={`
              absolute z-50 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden
              ${isExpanded ? 'bottom-[100%] left-0 w-[calc(100%-24px)] mx-3 mb-2' : 'left-[100%] bottom-0 ml-2 w-64'}
            `}
          >
            {/* Dropdown Header: User Info - CLICKABLE FOR MODAL */}
            <div
              onClick={handleProfileClick}
              className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm">
                {userInitials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="text-sm font-bold text-gray-900 truncate">{userName}</div>
                <div className="text-xs text-gray-500 truncate">{userEmail}</div>
              </div>
            </div>

            <div className="flex flex-col p-1">
              <button
                onClick={() => { setIsProfileOpen(false); /* Navigate to settings if needed */ }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
              >
                <Settings size={18} className="text-gray-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    await logoutMutation();
                    await client.clearStore();
                    dispatch(logout());
                    navigate('/login');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    // Still logout locally if backend fails
                    dispatch(logout());
                    navigate('/login');
                  }
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
              >
                <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Trigger */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`
            flex items-center transition-all duration-200 hover:bg-gray-50 rounded-lg
            ${isExpanded ? 'w-full px-2 py-2 gap-3' : 'justify-center w-full py-2'}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 border border-white shadow-sm ring-2 ring-transparent group-hover:ring-gray-100 transition-all">
            {userInitials}
          </div>

          <div
            className={`
                   overflow-hidden transition-all duration-300 flex flex-col items-start text-left
                   ${isExpanded ? 'w-auto opacity-100 ml-1' : 'w-0 opacity-0 hidden'}
                `}
          >
            <div className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">{userName}</div>
            <div className="text-[10px] text-gray-500 truncate max-w-[140px]">{userEmail}</div>
          </div>
        </button>
      </div>

      {/* Profile Modal */}
      {userId && (
        <UserProfileModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          userId={userId}
        />
      )}
    </aside>
  );
};

export default Sidebar;
