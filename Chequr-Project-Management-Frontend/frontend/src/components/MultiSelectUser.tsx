import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X as RemoveIcon, User, Search } from 'lucide-react';

interface UserOption {
    id: string;
    name: string;
    avatar?: string;
    email: string;
}

interface MultiSelectUserProps {
    label: string;
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    id?: string;
    variant?: 'dropdown' | 'list';
    users: UserOption[];
}

export default function MultiSelectUser({
    label,
    selectedIds,
    onChange,

    id,
    variant = 'dropdown',
    users = []
}: MultiSelectUserProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (userId: string) => {
        if (selectedIds.includes(userId)) {
            onChange(selectedIds.filter((id) => id !== userId));
        } else {
            onChange([...selectedIds, userId]);
        }
    };

    const removeUser = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        onChange(selectedIds.filter((id) => id !== userId));
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedUsers = users.filter(user => selectedIds.includes(user.id));

    const isFloatingList = variant === 'list'; // Renaming for clarity, though user asked for 'floating like invite'

    // If variant is 'list', it now behaves like a floating label input that opens a dropdown on click
    if (isFloatingList) {
        return (
            <div className="relative flex flex-col gap-2" ref={containerRef}>
                <div
                    className="relative cursor-pointer group"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {/* Floating Label Style Input Area */}
                    <div
                        className={`
                            w-full px-[16px] py-[10px] min-h-[48px] h-auto
                            bg-white border rounded-lg 
                            text-[14px] text-[#374151] flex items-center justify-between
                            transition-all
                            ${isOpen || selectedUsers.length > 0 ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-[#D1D5DB] hover:border-gray-400'}
                        `}
                    >
                        <div className="flex flex-wrap gap-2 flex-1 items-center">
                            {selectedUsers.length > 0 ? (
                                selectedUsers.map((user) => (
                                    <span
                                        key={user.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold uppercase">
                                            {user.name.charAt(0)}
                                        </div>
                                        {user.name.split(' ')[0]}
                                        <RemoveIcon
                                            size={14}
                                            className="cursor-pointer hover:text-indigo-900 ml-0.5"
                                            onClick={(e) => removeUser(e, user.id)}
                                        />
                                    </span>
                                ))
                            ) : (
                                <span className="text-transparent select-none">Placeholder</span>
                            )}
                        </div>
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ml-2 shrink-0`}
                        />
                    </div>

                    {/* Floating Label */}
                    <label
                        className={`
                            absolute left-[12px] px-[4px] bg-white rounded-sm
                            transition-all duration-200 pointer-events-none
                            ${(isOpen || selectedUsers.length > 0)
                                ? '-top-[9px] text-[11px] font-medium text-[#4F46E5]'
                                : 'top-[13px] text-[14px] font-normal text-[#9CA3AF]'
                            }
                        `}
                    >
                        {label}
                    </label>
                </div>

                {/* Dropdown List */}
                {isOpen && (
                    <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animation-fade-in-down">
                        {/* Search Bar */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full text-sm border border-gray-200 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[220px] overflow-y-auto p-1">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedIds.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleOption(user.id)}
                                            className={`
                                                px-3 py-2.5 cursor-pointer flex items-center justify-between rounded-md mb-0.5
                                                transition-all
                                                ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shadow-sm
                                                    ${isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200'}
                                                `}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{user.name}</div>
                                                    <div className="text-[11px] text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-sm text-gray-400 text-center italic flex flex-col items-center gap-2">
                                    <User className="w-8 h-8 text-gray-300 opacity-50" />
                                    <span>No matches found</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="relative flex flex-col gap-2"
            ref={containerRef}
        >
            <div className="relative" onClick={() => setIsOpen(!isOpen)}>
                {/* Input Area */}
                <div
                    className={`
            w-full px-[12px] py-[8px] min-h-[56px] h-auto
            bg-white border rounded-lg 
            text-[14px] text-[#374151] flex items-center justify-between
            cursor-pointer transition-all flex-wrap gap-2
            ${isOpen ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-[#D1D5DB]'}
          `}
                >
                    <div className="flex flex-wrap gap-2 flex-1 pt-3">
                        {selectedUsers.length > 0 ? (
                            selectedUsers.map((user) => (
                                <span
                                    key={user.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                                >
                                    <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[8px] font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    {user.name.split(' ')[0]}
                                    <RemoveIcon
                                        size={12}
                                        className="cursor-pointer hover:text-indigo-900 ml-1"
                                        onClick={(e) => removeUser(e, user.id)}
                                    />
                                </span>
                            ))
                        ) : (
                            <span className="text-transparent">Placeholder</span>
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2 mt-2`} />
                </div>

                {/* Floating Label */}
                <label
                    htmlFor={id}
                    className={`
            absolute left-[12px] px-[4px] bg-white
            transition-all duration-200 pointer-events-none
            ${(isOpen || selectedIds.length > 0)
                            ? '-top-[9px] text-[11px] font-medium text-[#4F46E5]'
                            : 'top-[18px] text-[14px] font-normal text-[#9CA3AF]'
                        }
          `}
                >
                    {label}
                </label>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1 max-h-[250px] overflow-y-auto flex flex-col">
                    <div className="px-3 py-2 border-b border-gray-100 sticky top-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm border-none focus:ring-0 p-0 text-gray-700 placeholder-gray-400"
                            autoFocus
                        />
                    </div>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                            const isSelected = selectedIds.includes(user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleOption(user.id)}
                                    className={`
                                        px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                                        hover:bg-gray-50 transition-colors
                                        ${isSelected ? 'bg-indigo-50/50' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border
                                            ${isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-transparent'}
                                        `}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className={`font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    {isSelected && <Check size={16} className="text-indigo-600" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                    )}
                </div>
            )}
        </div>
    );
}
