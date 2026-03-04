import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

interface StageItemProps {
    id: string;
    name: string;
    onNameChange: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    index: number;
}

export const StageItem: React.FC<StageItemProps> = ({
    id,
    name,
    onNameChange,
    onDelete,
    index,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-lg shadow-xs transition-all ${isDragging ? 'shadow-md opacity-50 ring-2 ring-indigo-500/20' : 'hover:border-indigo-200'}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 transition-colors"
                title="Drag"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(id, e.target.value)}
                    placeholder={`Stage ${index + 1}`}
                    className="w-full text-[11px] font-bold text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-300 py-0.5"
                />
            </div>

            <button
                type="button"
                onClick={() => onDelete(id)}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all active:scale-90"
                title="Delete"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
};
