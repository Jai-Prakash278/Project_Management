import React from 'react';
import {
    Type,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Baseline,
    Image as ImageIcon,
    Code,
    Plus,
    Link,
    Undo2,
    Redo2,
    History,
    ChevronDown
} from 'lucide-react';

interface RichTextToolbarProps {
    onAction?: (action: string) => void;
    onImageClick?: () => void;
    className?: string;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onAction, onImageClick, className = '' }) => {
    return (
        <div className={`flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-white select-none ${className}`}>
            {/* Text Style */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-0.5"
                title="Text style"
                onClick={() => onAction?.('style')}
            >
                <Type size={18} />
                <ChevronDown size={12} className="mt-0.5" />
            </button>

            {/* Bold */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Bold"
                onClick={() => onAction?.('bold')}
            >
                <Bold size={18} />
            </button>

            {/* Italic */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Italic"
                onClick={() => onAction?.('italic')}
            >
                <Italic size={18} />
            </button>

            {/* Underline */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Underline"
                onClick={() => onAction?.('underline')}
            >
                <Underline size={18} />
            </button>

            {/* List Type Dropdown */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-0.5"
                title="Lists"
                onClick={() => onAction?.('list')}
            >
                <List size={18} />
                <ChevronDown size={12} className="mt-0.5" />
            </button>

            {/* Text Color */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Text color"
                onClick={() => onAction?.('color')}
            >
                <Baseline size={18} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Image */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Add image"
                onClick={(e) => {
                    e.preventDefault();
                    onImageClick?.();
                }}
            >
                <ImageIcon size={18} />
            </button>

            {/* Code */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Code snippet"
                onClick={() => onAction?.('code')}
            >
                <Code size={18} />
            </button>

            {/* More / Plus */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="More"
                onClick={() => onAction?.('more')}
            >
                <Plus size={18} />
            </button>

            {/* Link */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Link"
                onClick={() => onAction?.('link')}
            >
                <Link size={18} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1 ml-auto" />

            {/* Undo */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Undo"
                onClick={() => onAction?.('undo')}
            >
                <Undo2 size={18} />
            </button>

            {/* Redo */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="Redo"
                onClick={() => onAction?.('redo')}
            >
                <Redo2 size={18} />
            </button>

            {/* History */}
            <button
                type="button"
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
                title="History"
                onClick={() => onAction?.('history')}
            >
                <History size={18} />
            </button>
        </div>
    );
};

export default RichTextToolbar;
