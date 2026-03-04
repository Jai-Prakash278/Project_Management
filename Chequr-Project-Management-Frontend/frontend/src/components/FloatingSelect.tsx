import { useState, SelectHTMLAttributes } from 'react';

interface FloatingSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
    label: string;
    id: string;
    error?: string;
    containerClassName?: string;
    children: React.ReactNode;
}

export default function FloatingSelect({
    label,
    id,
    value,
    onChange,
    children,
    error,
    containerClassName = '',
    ...selectProps
}: FloatingSelectProps) {
    const [isFocused, setIsFocused] = useState(false);
    // Ensure value is treated as string for length check, handle 0 for numbers
    const hasValue = value !== undefined && value !== '' && value !== null;
    const isFloating = isFocused || hasValue;

    return (
        <div className={`flex flex-col gap-2 ${containerClassName}`}>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full px-[16px] py-[10px] h-[48px] 
                        bg-white border rounded-lg 
                        transition-all text-[14px] text-[#374151]
                        focus:outline-hidden focus:ring-2 focus:ring-[#4F46E5]/20
                        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                        ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#D1D5DB] focus:border-[#4F46E5]'
                        }
                    `}
                    {...selectProps}
                >
                    {children}
                </select>
                <label
                    htmlFor={id}
                    className={`
                        absolute left-[12px] px-[4px] bg-white
                        transition-all duration-200 pointer-events-none
                        ${isFloating
                            ? '-top-[9px] text-[11px] font-medium z-10'
                            : 'top-[14px] text-[14px] font-normal'
                        }
                        ${error
                            ? 'text-red-500'
                            : isFocused
                                ? 'text-[#4F46E5]'
                                : 'text-[#9CA3AF]'
                        }
                    `}
                >
                    {label}
                </label>
            </div>
            {error && (
                <span className="text-[12px] text-red-500 font-medium ml-[4px]">
                    {error}
                </span>
            )}
        </div>
    );
}
