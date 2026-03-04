import React, { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    children: ReactNode;
    items: string[];
    onAddClick: (columnId: string) => void;
    isInvalidTarget?: boolean;
    isValidTarget?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    id,
    title,
    count,
    children,
    items,
    onAddClick,
    isInvalidTarget,
    isValidTarget
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`
                flex flex-col w-[280px] min-w-[280px] rounded-xl h-full max-h-full transition-all duration-200 border-2
                ${isOver ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200 ring-inset' : ''}
                ${!isOver && isValidTarget ? 'bg-green-50/30 border-dashed border-green-300' : ''}
                ${!isOver && isInvalidTarget ? 'opacity-40 grayscale-[0.5] border-transparent' : ''}
                ${!isOver && !isValidTarget && !isInvalidTarget ? 'bg-[#F4F5F7] border-transparent' : ''}
            `}
        >
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {count}
                    </span>
                </div>
                <button
                    onClick={() => onAddClick(id)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3 custom-scrollbar">
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>
            </div>
        </div>
    );
};

export default KanbanColumn;
