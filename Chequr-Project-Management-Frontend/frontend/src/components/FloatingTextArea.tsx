import { useState, TextareaHTMLAttributes, forwardRef } from 'react';
import RichTextToolbar from './RichTextToolbar';
import RichTextField, { RichTextFieldHandle } from './RichTextField';

interface FloatingTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
    error?: string;
    containerClassName?: string;
    showToolbar?: boolean;
    onImageClick?: () => void;
    onRemoveImage?: (id: string) => void;
    richText?: boolean;
}

const FloatingTextArea = forwardRef<RichTextFieldHandle | HTMLTextAreaElement, FloatingTextAreaProps>(({
    label,
    id,
    error,
    containerClassName = '',
    value,
    onChange,
    className = '',
    showToolbar = false,
    onImageClick,
    onRemoveImage,
    richText = false,
    ...textareaProps
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== '';
    const isFloating = isFocused || hasValue;

    const handleAction = (action: string) => {
        if (richText && ref && 'current' in ref && ref.current) {
            (ref.current as RichTextFieldHandle).handleAction(action);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${containerClassName}`}>
            <div className={`
                relative border rounded-lg transition-all bg-white
                ${error
                    ? 'border-red-500 ring-0'
                    : isFocused
                        ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20'
                        : 'border-[#D1D5DB]'
                }
            `}>
                <label
                    htmlFor={id}
                    className={`
                        absolute left-[12px] px-[4px] bg-white
                        transition-all duration-200 pointer-events-none
                        ${isFloating
                            ? '-top-[9px] text-[11px] font-medium z-10'
                            : showToolbar
                                ? 'top-[52px] text-[14px] font-normal text-[#9CA3AF]'
                                : 'top-[12px] text-[14px] font-normal text-[#9CA3AF]'
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

                {showToolbar && (
                    <div className="border-b border-gray-200">
                        <RichTextToolbar
                            onAction={handleAction}
                            onImageClick={onImageClick}
                            className="rounded-t-lg"
                        />
                    </div>
                )}
                <div className="relative">
                    {richText ? (
                        <RichTextField
                            ref={ref as React.Ref<RichTextFieldHandle>}
                            value={value as string}
                            onChange={(newValue) => {
                                // Simulate event for compatibility with standard handlers
                                if (onChange) {
                                    onChange({ target: { value: newValue } } as any);
                                }
                            }}
                            onImageClick={onImageClick}
                            onRemoveImage={onRemoveImage}
                            showToolbar={false} // FloatingTextArea handles its own toolbar above
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="border-none" // FloatingTextArea provides the border
                            minHeight="120px"
                        />
                    ) : (
                        <textarea
                            id={id}
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            value={value}
                            onChange={onChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className={`
                                w-full px-[16px] py-[12px] min-h-[120px]
                                bg-transparent text-[14px] text-[#374151]
                                placeholder:text-transparent
                                focus:outline-hidden
                                disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                                resize-y
                                ${className}
                            `}
                            {...textareaProps}
                        />
                    )}
                </div>
            </div>
            {error && (
                <span className="text-[12px] text-red-500 font-medium ml-[4px]">
                    {error}
                </span>
            )}
        </div>
    );
});

export default FloatingTextArea;
