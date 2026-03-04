import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import IssueCard from './IssueCard';
import toast from 'react-hot-toast';
import { Issue, IssueType, Workflow, Stage, Transition } from '../../types/issue.types';
import { validateTransition } from '../../utils/workflowValidation';

interface KanbanBoardProps {
    activeSprint: string;
    searchQuery?: string;
    items: Record<string, Issue[]>;
    setItems: React.Dispatch<React.SetStateAction<Record<string, Issue[]>>>;
    onAddClick: (columnId: string) => void;
    onIssueMove?: (issueId: string, stageId: string, position: number, issue: Issue) => void;
    onStageDrop?: (issue: Issue, newStageId: string) => void;
    onIssueClick?: (issue: Issue) => void;
    onDragStart?: () => void;
    selectedAssigneeIds?: string[];
    selectedTypes?: IssueType[];
    workflow?: Workflow;
    stages: Stage[];
    transitions?: Transition[];
    currentUserRoles?: string[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    activeSprint,
    searchQuery = '',
    items,
    setItems,
    onAddClick,
    onIssueMove,
    onStageDrop,
    onIssueClick,
    onDragStart,
    selectedAssigneeIds = [],
    selectedTypes = [],
    workflow,
    stages = [],
    transitions = [],
    currentUserRoles
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [originalItems, setOriginalItems] = useState<Record<string, Issue[]>>({});
    const [dragSourceContainer, setDragSourceContainer] = useState<string | null>(null);

    const filteredItems = React.useMemo(() => {
        const filtered: Record<string, Issue[]> = {};
        const activeSprintId = activeSprint;

        Object.keys(items).forEach(columnId => {
            const normalizedColumnId = columnId?.toLowerCase() || '';
            if (!normalizedColumnId) return;
            filtered[normalizedColumnId] = (items[columnId] || []).filter(issue => {
                const matchesSprint = !activeSprintId || activeSprintId === 'all' || activeSprintId === 'All Issues' ||
                    (typeof issue.sprint === 'object' && issue.sprint !== null ? (issue.sprint as any).id === activeSprintId : issue.sprint === activeSprintId);

                let assigneeMatches = true;
                if (selectedAssigneeIds.length > 0) {
                    const issueAssigneeId = (issue as any).assigneeId || (issue.assignee as any)?.id;
                    if (selectedAssigneeIds.includes('unassigned')) {
                        assigneeMatches = !issueAssigneeId || selectedAssigneeIds.includes(issueAssigneeId);
                    } else {
                        assigneeMatches = issueAssigneeId && selectedAssigneeIds.includes(issueAssigneeId);
                    }
                }

                const typeMatches = selectedTypes.length === 0 || selectedTypes.includes(issue.type);
                const searchMatches = !searchQuery ||
                    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (issue.id || "").toLowerCase().includes(searchQuery.toLowerCase());

                return matchesSprint && assigneeMatches && typeMatches && searchMatches;
            });
        });
        return filtered;
    }, [items, activeSprint, selectedAssigneeIds, selectedTypes, searchQuery]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (id: string) => {
        if (!id) return null;
        if (id in items) return id;
        const normalizedId = id.toLowerCase();
        if (normalizedId in items) return normalizedId;
        // Case-insensitive search through keys
        const match = Object.keys(items).find(key => key.toLowerCase() === normalizedId);
        if (match) return match;

        return Object.keys(items).find((key) => items[key].some((item) => item.id === id));
    };

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        setActiveId(id);
        const container = findContainer(id);
        setDragSourceContainer(container || null);
        setOriginalItems({ ...items });
        if (onDragStart) onDragStart();
    };

    const getValidation = (from: string, to: string) => {
        const defaultStages: Stage[] = [
            { id: 'todo', name: 'Todo', orderIndex: 1 },
            { id: 'inprogress', name: 'In Progress', orderIndex: 2 },
            { id: 'blocked', name: 'Blocked', orderIndex: 3 },
            { id: 'inreview', name: 'In Review', orderIndex: 4 },
            { id: 'done', name: 'Done', orderIndex: 5 },
        ];

        const currentStages = stages.length > 0 ? stages : defaultStages;

        const fromStage = currentStages.find(s => s.id === from) ||
            currentStages.find(s => s.name.toLowerCase().replace(' ', '') === from.toLowerCase()) ||
            defaultStages.find(s => s.id === from);

        const toStage = currentStages.find(s => s.id === to) ||
            currentStages.find(s => s.name.toLowerCase().replace(' ', '') === to.toLowerCase()) ||
            defaultStages.find(s => s.id === to);

        if (!fromStage || !toStage) return { isValid: true };

        return validateTransition({
            fromStage,
            toStage,
            workflow,
            transitions,
            currentUserRoles
        });
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        const fromContainer = dragSourceContainer ?? activeContainer;
        if (!getValidation(fromContainer, overContainer).isValid) {
            return;
        }

        setItems((prev) => {
            const activeItems = prev[activeContainer] || [];
            const overItems = prev[overContainer] || [];

            const activeIndex = activeItems.findIndex((item) => item.id === active.id);
            const overIndex = overItems.findIndex((item) => item.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowLastItem = over && overIndex === overItems.length - 1;
                const modifier = isBelowLastItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            const updatedIssue = { ...activeItems[activeIndex] };

            updatedIssue.stageId = overContainer;
            updatedIssue.stage = stages.find(s => s.id === overContainer);

            return {
                ...prev,
                [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    updatedIssue,
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string);

        if (!activeContainer || !overContainer) {
            setActiveId(null);
            setDragSourceContainer(null);
            return;
        }

        const fromContainer = dragSourceContainer ?? activeContainer;

        if (activeContainer !== overContainer) {
            const validation = getValidation(fromContainer, overContainer);
            if (!validation.isValid) {
                toast.error(validation.errorMessage || 'Invalid status transition.', { position: 'bottom-right' });
                setItems(originalItems);
                setActiveId(null);
                setDragSourceContainer(null);
                return;
            }
        }

        const isCrossColumn = dragSourceContainer !== null && dragSourceContainer !== overContainer;
        const activeIndex = (items[activeContainer] || []).findIndex((item) => item.id === active.id);
        const overIndex = (items[overContainer] || []).findIndex((item) => item.id === over?.id);

        if (activeIndex !== -1 && (activeIndex !== overIndex || isCrossColumn)) {
            if (isCrossColumn) {
                // Cross-column drag: revert optimistic state (BoardPage snapshot handles restore)
                // and open the drawer for confirmation instead of immediately mutating
                const currentItem = items[activeContainer]?.[activeIndex] || originalItems[dragSourceContainer!]?.find(i => i.id === active.id);
                setItems(originalItems);

                if (currentItem && onStageDrop) {
                    onStageDrop(currentItem, overContainer);
                }
            } else {
                // Same-column reorder: apply immediately
                const finalIndex = overIndex;
                setItems((prev) => {
                    return { ...prev, [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex) };
                });

                if (onIssueMove) {
                    onIssueMove(active.id as string, overContainer, finalIndex, items[activeContainer][activeIndex]);
                }
            }
        }

        setActiveId(null);
        setDragSourceContainer(null);
    };

    return (
        <div className="flex gap-4 p-6 h-full overflow-x-auto custom-scrollbar bg-white relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {stages.map((col) => {
                    // Compute valid/invalid target for this column when dragging
                    let isValidTarget: boolean | undefined = undefined;
                    let isInvalidTarget: boolean | undefined = undefined;
                    if (activeId && dragSourceContainer && dragSourceContainer !== col.id) {
                        const validation = getValidation(dragSourceContainer, col.id);
                        if (validation.isValid) {
                            isValidTarget = true;
                        } else {
                            isInvalidTarget = true;
                        }
                    }
                    return (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.name}
                            count={filteredItems[col.id?.toLowerCase()]?.length || 0}
                            items={filteredItems[col.id?.toLowerCase()]?.map((i) => i.id) || []}
                            onAddClick={onAddClick}
                            isValidTarget={isValidTarget}
                            isInvalidTarget={isInvalidTarget}
                        >
                            {filteredItems[col.id?.toLowerCase()]?.map((issue) => (
                                <IssueCard
                                    key={issue.id}
                                    {...issue}
                                    assignee={issue.assignee || undefined}
                                    subtasks={Array.isArray(issue.subtaskList) ? issue.subtaskList.length : 0}
                                    comments={Array.isArray(issue.comments) ? issue.comments.length : 0}
                                    onClick={() => onIssueClick && onIssueClick(issue)}
                                />
                            ))}
                        </KanbanColumn>
                    );
                })}

                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: '0.5' } },
                    }),
                }}>
                    {activeId ? (
                        <div className="rotate-2 scale-105 shadow-2xl rounded-xl overflow-hidden">
                            <div className="bg-white p-4 rounded shadow border border-indigo-200">
                                Moving...
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default KanbanBoard;
