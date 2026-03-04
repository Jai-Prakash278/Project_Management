import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import RichTextToolbar from './RichTextToolbar';
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';

export interface RichTextFieldHandle {
    insertImage: (url: string, id?: string) => void;
    focus: () => void;
    handleAction: (action: string) => void;
}

interface RichTextFieldProps {
    value: string; // HTML string
    onChange: (newValue: string) => void;
    onImageClick?: () => void;
    onRemoveImage?: (id: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    showToolbar?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

const RichTextField = forwardRef<RichTextFieldHandle, RichTextFieldProps>(({
    value,
    onChange,
    onImageClick,
    onRemoveImage,
    placeholder = 'Add details...',
    className = '',
    minHeight = '120px',
    showToolbar = true,
    onFocus,
    onBlur
}, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const lastRange = useRef<Range | null>(null);
    const isInternalChange = useRef(false);
    const [hoveredImage, setHoveredImage] = useState<{ element: HTMLImageElement, rect: DOMRect } | null>(null);

    // Initial content and value updates
    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    // Track selection
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Check if range is inside our editor
            if (editorRef.current?.contains(range.commonAncestorContainer)) {
                lastRange.current = range.cloneRange();
            }
        }
    };

    useImperativeHandle(ref, () => ({
        insertImage: (url: string, id?: string) => {
            if (editorRef.current) {
                editorRef.current.focus();

                // Restore selection if we have one
                const sel = window.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    if (lastRange.current) {
                        sel.addRange(lastRange.current);
                    } else {
                        const range = document.createRange();
                        range.selectNodeContents(editorRef.current);
                        range.collapse(false);
                        sel.addRange(range);
                    }
                }

                // Create custom image style
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '8px';
                img.style.border = '1px solid #e5e7eb';
                img.style.margin = '12px 0';
                img.style.display = 'block';
                img.dataset.attachmentId = id; // Track for deletion
                img.className = 'chequr-description-image cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all';

                const range = window.getSelection()?.getRangeAt(0);
                if (range) {
                    range.deleteContents();
                    range.insertNode(img);
                    // Add a break after image
                    const br = document.createElement('br');
                    img.after(br);

                    // Move cursor after the break
                    range.setStartAfter(br);
                    range.setEndAfter(br);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }

                handleInput();
                setHoveredImage(null);
            }
        },
        focus: () => {
            editorRef.current?.focus();
        },
        handleAction: (action: string) => {
            handleAction(action);
        }
    }));

    const handleInput = () => {
        if (editorRef.current) {
            isInternalChange.current = true;
            onChange(editorRef.current.innerHTML);
            saveSelection();
        }
    };

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
            handleInput();
        }
    };

    const handleAction = (action: string) => {
        switch (action) {
            case 'bold': execCommand('bold'); break;
            case 'italic': execCommand('italic'); break;
            case 'underline': execCommand('underline'); break;
            case 'list': execCommand('insertUnorderedList'); break;
            case 'style': execCommand('formatBlock', '<h2>'); break;
            case 'code': execCommand('formatBlock', '<pre>'); break;
            case 'undo': execCommand('undo'); break;
            case 'redo': execCommand('redo'); break;
            default: break;
        }
    };

    const handleImageToolbarAction = (action: 'left' | 'center' | 'right' | 'remove') => {
        if (!hoveredImage) return;

        const { element } = hoveredImage;
        switch (action) {
            case 'left':
                element.style.margin = '12px auto 12px 0';
                element.style.display = 'block';
                break;
            case 'center':
                element.style.margin = '12px auto';
                element.style.display = 'block';
                break;
            case 'right':
                element.style.margin = '12px 0 12px auto';
                element.style.display = 'block';
                break;
            case 'remove':
                let id = element.dataset.attachmentId;
                // Fallback: extract from src if dataset is missing (e.g., loaded from DB)
                if (!id || id === 'undefined') {
                    const match = element.src.match(/\/attachments\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
                    if (match) id = match[1];
                }

                element.remove();
                if (id && id !== 'undefined' && onRemoveImage) {
                    onRemoveImage(id);
                }
                break;
        }
        handleInput();
        setHoveredImage(null);
    };

    // Placeholder management
    const showPlaceholder = !value && !isFocused;

    return (
        <div
            className={`
                flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white transition-all relative
                ${isFocused ? 'ring-2 ring-indigo-500/20 border-indigo-500' : 'hover:border-gray-300'}
                ${className}
            `}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
        >
            {showToolbar && (
                <RichTextToolbar
                    onAction={handleAction}
                    onImageClick={onImageClick}
                />
            )}
            <div className="relative">
                {showPlaceholder && (
                    <div className="absolute top-3 left-4 text-gray-400 pointer-events-none text-sm italic">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus?.();
                    }}
                    onBlur={(e) => {
                        // Don't blur if we are clicking the toolbar
                        if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.image-hover-toolbar')) {
                            return;
                        }
                        saveSelection();
                        setIsFocused(false);
                        // Delay clearing hovered image so click can propagate to toolbar
                        setTimeout(() => setHoveredImage(null), 200);
                        onBlur?.();
                    }}
                    onMouseMove={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'IMG') {
                            const rect = target.getBoundingClientRect();
                            const containerRect = editorRef.current?.getBoundingClientRect();
                            if (containerRect) {
                                setHoveredImage({
                                    element: target as HTMLImageElement,
                                    rect: new DOMRect(rect.left - containerRect.left, rect.top - containerRect.top, rect.width, rect.height)
                                });
                            }
                        } else if (e.relatedTarget && !(e.relatedTarget as HTMLElement).closest?.('.image-hover-toolbar')) {
                            // Don't clear if moving within the same image or towards toolbar
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (e.relatedTarget && !(e.relatedTarget as HTMLElement).closest?.('.image-hover-toolbar')) {
                            setHoveredImage(null);
                        }
                    }}
                    className="p-4 outline-none text-sm text-gray-800 leading-relaxed overflow-y-auto rich-text-editor"
                    style={{ minHeight }}
                />

                {/* Floating Image Toolbar */}
                {hoveredImage && (
                    <div
                        className="image-hover-toolbar absolute z-50 flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200"
                        style={{
                            top: `${hoveredImage.rect.top - 45}px`,
                            left: `${hoveredImage.rect.left + (hoveredImage.rect.width / 2)}px`,
                            transform: 'translateX(-50%)'
                        }}
                        onMouseEnter={() => { }} // Keep visible
                        onMouseLeave={() => setHoveredImage(null)}
                    >
                        <button
                            onClick={() => handleImageToolbarAction('left')}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <AlignLeft size={16} />
                        </button>
                        <button
                            onClick={() => handleImageToolbarAction('center')}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <AlignCenter size={16} />
                        </button>
                        <button
                            onClick={() => handleImageToolbarAction('right')}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <AlignRight size={16} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button
                            onClick={() => handleImageToolbarAction('remove')}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default RichTextField;
