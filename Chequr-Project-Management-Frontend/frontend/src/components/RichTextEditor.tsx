import React, { useRef, useEffect, useCallback } from 'react';
import {
    Type,
    Bold,
    Italic,
    List,
    ListOrdered,
    ListTodo,
    Link as LinkIcon,
    Image,
    AtSign,
    Smile,
    Code,
    MoreHorizontal,
    ChevronDown,
    Plus,
} from 'lucide-react';

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    className?: string;
    id?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Add content...',
    minHeight = 120,
    className = '',
    id,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (el.innerHTML !== value) {
            el.innerHTML = value || '';
        }
    }, [value]);

    const emitChange = useCallback(() => {
        const html = editorRef.current?.innerHTML ?? '';
        isInternalChange.current = true;
        onChange(html);
    }, [onChange]);

    const exec = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        emitChange();
    }, [emitChange]);

    const handleInput = useCallback(() => {
        emitChange();
    }, [emitChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        emitChange();
    }, [emitChange]);

    return (
        <div className={`rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50">
                <button
                    type="button"
                    title="Text style"
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 flex items-center gap-0.5 text-xs font-medium"
                    onClick={() => exec('formatBlock', 'p')}
                >
                    <Type size={16} />
                    <ChevronDown size={14} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-0.5" />
                <button type="button" title="Bold" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => exec('bold')}>
                    <Bold size={16} />
                </button>
                <button type="button" title="Italic" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => exec('italic')}>
                    <Italic size={16} />
                </button>
                <button type="button" title="More" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <MoreHorizontal size={16} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-0.5" />
                <button type="button" title="Text color" className="p-1.5 rounded hover:bg-gray-200 text-gray-600 flex items-center gap-0.5 text-xs font-medium">
                    <span className="underline">A</span>
                    <ChevronDown size={14} />
                </button>
                <button type="button" title="Bullet list" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => exec('insertUnorderedList')}>
                    <List size={16} />
                </button>
                <button type="button" title="Numbered list" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => exec('insertOrderedList')}>
                    <ListOrdered size={16} />
                </button>
                <button type="button" title="Task list" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <ListTodo size={16} />
                </button>
                <button type="button" title="Link" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) exec('createLink', url);
                }}>
                    <LinkIcon size={16} />
                </button>
                <button type="button" title="Image" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <Image size={16} />
                </button>
                <button type="button" title="Mention" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <AtSign size={16} />
                </button>
                <button type="button" title="Emoji" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <Smile size={16} />
                </button>
                <button type="button" title="Code" className="p-1.5 rounded hover:bg-gray-200 text-gray-600" onClick={() => exec('formatBlock', 'pre')}>
                    <Code size={16} />
                </button>
                <button type="button" title="More options" className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                    <Plus size={16} />
                </button>
            </div>
            {/* Editor area */}
            <div className="relative">
                <div
                    ref={editorRef}
                    id={id}
                    contentEditable
                    data-placeholder={placeholder}
                    role="textbox"
                    aria-multiline="true"
                    aria-placeholder={placeholder}
                    className="w-full p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-y min-h-[80px] prose prose-sm max-w-none
                        [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-gray-400"
                    style={{ minHeight: `${minHeight}px` }}
                    onInput={handleInput}
                    onPaste={handlePaste}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
