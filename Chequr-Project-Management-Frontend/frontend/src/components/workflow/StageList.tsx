import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { Plus } from 'lucide-react';
import { StageItem } from './StageItem';

interface Stage {
    id: string;
    name: string;
    orderIndex: number;
}

interface StageListProps {
    stages: Stage[];
    onStagesChange: (stages: Stage[]) => void;
}

export const StageList: React.FC<StageListProps> = ({ stages, onStagesChange }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = stages.findIndex((s) => s.id === active.id);
            const newIndex = stages.findIndex((s) => s.id === over.id);

            const reorderedStages = arrayMove(stages, oldIndex, newIndex).map(
                (stage, index) => ({
                    ...stage,
                    orderIndex: index,
                })
            );

            onStagesChange(reorderedStages);
        }
    };

    const handleAddStage = () => {
        const newStage: Stage = {
            id: `stage-${Date.now()}`,
            name: '',
            orderIndex: stages.length,
        };
        onStagesChange([...stages, newStage]);
    };

    const handleNameChange = (id: string, name: string) => {
        onStagesChange(
            stages.map((s) => (s.id === id ? { ...s, name } : s))
        );
    };

    const handleDeleteStage = (id: string) => {
        onStagesChange(
            stages
                .filter((s) => s.id !== id)
                .map((s, index) => ({ ...s, orderIndex: index }))
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Stages ({stages.length})
                </h3>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={stages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-1">
                        {stages.map((stage, index) => (
                            <StageItem
                                key={stage.id}
                                id={stage.id}
                                name={stage.name}
                                index={index}
                                onNameChange={handleNameChange}
                                onDelete={handleDeleteStage}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <button
                type="button"
                onClick={handleAddStage}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-[10px] font-bold"
            >
                <Plus className="w-3 h-3" />
                Add Stage
            </button>

            {stages.length < 2 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                    ⚠️ At least 2 stages are required for a valid workflow.
                </p>
            )}
        </div>
    );
};
