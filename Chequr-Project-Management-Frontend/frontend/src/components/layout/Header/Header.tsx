import { Search, Bell, Settings } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';


export const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Derive name and initials from email
  const userName = user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'Guest';
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'G';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-300">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900 font-plus-jakarta whitespace-nowrap">
              Chequr
            </span>
          </div>
        </div>

        {/* Right Section: Search, Icons, and Profile */}
        <div className="flex items-center gap-6">
          {/* Search Bar */}
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-3 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/20 transition-all font-inter"
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">
                {userName}
              </p>
              <p className="text-[10px] text-gray-500 font-inter mt-1">
                {user?.email || 'guest@example.com'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-3 ring-indigo-500/20 shadow-lg">
              {userInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
