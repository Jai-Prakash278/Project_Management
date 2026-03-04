import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X as RemoveIcon } from 'lucide-react';

interface MultiSelectDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    id?: string;
    name?: string;
}

export default function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange,
    id,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item) => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const removeRole = (e: React.MouseEvent, roleToRemove: string) => {
        e.stopPropagation(); // Prevent opening dropdown
        onChange(selected.filter((role) => role !== roleToRemove));
    };

    return (
        <div
            className="relative flex flex-col gap-2"
            ref={containerRef}
            onClick={() => setIsOpen(!isOpen)} // Add click handler to toggle dropdown since hover is removed
        >
            <div className="relative">
                {/* Input implementation to match FloatingLabel style */}
                <div
                    className={`
            w-full px-[12px] py-[8px] min-h-[48px] h-auto
            bg-white border rounded-lg 
            text-[14px] text-[#374151] flex items-center justify-between
            cursor-pointer transition-all flex-wrap gap-2
            ${isOpen ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-[#D1D5DB]'}
          `}
                >
                    <div className="flex flex-wrap gap-2 flex-1">
                        {selected.length > 0 ? (
                            selected.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                                >
                                    {role}
                                    <RemoveIcon
                                        size={12}
                                        className="cursor-pointer hover:text-indigo-900"
                                        onClick={(e) => removeRole(e, role)}
                                    />
                                </span>
                            ))
                        ) : (
                            <span className="text-transparent">Placeholder</span> // Keep layout stable
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
                </div>

                {/* Floating Label */}
                <label
                    htmlFor={id}
                    className={`
            absolute left-[12px] px-[4px] bg-white
            transition-all duration-200 pointer-events-none
            ${(isOpen || selected.length > 0)
                            ? '-top-[9px] text-[11px] font-medium text-[#4F46E5]'
                            : 'top-[14px] text-[14px] font-normal text-[#9CA3AF]'
                        }
          `}
                >
                    {label}
                </label>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-[52px] left-0 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1 max-h-[200px] overflow-y-auto">
                    {options.map((option) => {
                        const isSelected = selected.includes(option);
                        return (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={`
                  px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                  hover:bg-gray-50 transition-colors
                  ${isSelected ? 'bg-indigo-50 text-[#4F46E5]' : 'text-gray-700'}
                `}
                            >
                                <span>{option}</span>
                                {isSelected && <Check size={16} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
