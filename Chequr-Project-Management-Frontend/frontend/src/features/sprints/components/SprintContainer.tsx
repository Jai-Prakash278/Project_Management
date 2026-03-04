import React, { useState, Fragment, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Sprint } from '../types';
import SprintHeader from './SprintHeader';
import StartSprintModal from './StartSprintModal';
import CompleteSprintModal from './CompleteSprintModal';
import { CheckCircle2, Circle, Clock, ChevronDown, GripVertical } from 'lucide-react';

interface SprintContainerProps {
    sprint: Sprint;
    stages: any[];
    onStartSprint: (sprintId: string, startDate: string, endDate: string, goal: string) => void;
    onCompleteSprint: (sprintId: string, action: 'backlog' | 'new_sprint') => void;
    onUpdateIssueStatus?: (issueId: string, stageId: string) => void;
    onEditSprint?: (sprint: Sprint) => void;
    onDeleteSprint?: (sprintId: string) => void;
    activeSprintId?: string | null;
}

const StatusDropdown: React.FC<{
    statusId: string;
    stages: any[];
    onChange: (stageId: string) => void;
}> = ({ statusId, stages, onChange }) => {
    const getStatusConfig = (stage: any) => {
        if (!stage) return { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Unknown' };

        if (stage.isFinal) {
            return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: stage.name };
        }

        const name = stage.name.toUpperCase();
        if (name.includes('PROGRESS') || name.includes('DOING') || name.includes('DEV')) {
            return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: stage.name };
        }

        return { icon: Circle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: stage.name };
    };

    const currentStage = stages.find(s => s.id === statusId) || stages[0];
    const current = getStatusConfig(currentStage);
    const Icon = current.icon;

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${current.bg} ${current.border} ${current.color} hover:opacity-80 transition-opacity`}
            >
                <Icon className="w-3 h-3" />
                <span>{current.label}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 pb-1">
                    <div className="p-1 max-h-60 overflow-y-auto">
                        {stages.map((s) => {
                            const config = getStatusConfig(s);
                            const ItemIcon = config.icon;
                            return (
                                <button
                                    key={s.id}
                                    className={`${s.id === statusId ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                                        } group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-gray-50`}
                                    onClick={() => {
                                        onChange(s.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <ItemIcon className={`w-3 h-3 ${config.color}`} />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Draggable wrapper for sprint issues
interface DraggableSprintIssueProps {
    issue: any;
    sprintId: string;
    stages: any[];
    onUpdateIssueStatus?: (issueId: string, stageId: string) => void;
}

const DraggableSprintIssue: React.FC<DraggableSprintIssueProps> = ({ issue, sprintId, stages, onUpdateIssueStatus }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: issue.id,
        data: { issue, fromSprintId: sprintId },
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000, position: 'relative' as const, touchAction: 'none',
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`group p-3 border rounded-lg bg-white cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging ? 'shadow-lg ring-2 ring-indigo-400 rotate-1 border-indigo-400 opacity-90' : 'border-gray-200 hover:shadow-md hover:border-indigo-200'
                }`}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">
                                <GripVertical className="w-4 h-4" />
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${issue.type === 'BUG' ? 'bg-red-50 text-red-600 border-red-100' :
                                issue.type === 'STORY' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {issue.type === 'BUG' ? 'BUG' : issue.type === 'STORY' ? 'STORY' : 'TASK'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">{issue.id}</span>
                        </div>
                        <div onPointerDown={(e) => e.stopPropagation()}>
                            {onUpdateIssueStatus ? (
                                <StatusDropdown
                                    statusId={issue.stage?.id || issue.stageId}
                                    stages={stages}
                                    onChange={(s) => onUpdateIssueStatus(issue.id, s)}
                                />
                            ) : (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase font-medium">
                                    {issue.stage?.name || 'Unknown'}
                                </span>
                            )}
                        </div>
                    </div>
                    <span className="font-medium text-sm text-gray-900">{issue.title}</span>
                </div>
            </div>
        </div>
    );
};

const SprintContainer: React.FC<SprintContainerProps> = ({
    sprint,
    stages,
    onStartSprint,
    onCompleteSprint,
    activeSprintId,
    onUpdateIssueStatus,
    onEditSprint,
    onDeleteSprint
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const isCompleted = sprint.status === 'COMPLETED'; // assuming SprintStatus enum string value

    const visibleIssues = useMemo(() => {
        if (!sprint.issues) return [];
        // Show all issues associated with this sprint. 
        // For completed sprints, the backend only maintains links for finished issues.
        return sprint.issues;
    }, [sprint.issues]);

    const { setNodeRef, isOver } = useDroppable({
        id: sprint.id,
        data: { sprint },
        disabled: isCompleted
    });

    const handleStartSprint = (startDate: string, endDate: string, goal: string) => {
        onStartSprint(sprint.id, startDate, endDate, goal);
    };

    // Start is disabled if:
    // 1. Another sprint is active (and it's not this one)
    // 2. This sprint has no issues
    let startDisabledReason: string | boolean | undefined = undefined;

    if (activeSprintId && activeSprintId !== sprint.id) {
        startDisabledReason = "Another sprint is already active";
    } else if (!sprint.issues || sprint.issues.length === 0) {
        startDisabledReason = "Sprint cannot be started with 0 issues";
    }

    const isStartDisabled = !!startDisabledReason;

    const completedIssuesCount = sprint.issues?.filter(i => {
        const isFinal = i.stage?.isFinal;
        const stageName = (i.stage?.name || '').toUpperCase();
        return isFinal || stageName.includes('DONE') || stageName.includes('COMPLETE');
    }).length || 0;

    const incompleteIssuesCount = (sprint.issues?.length || 0) - completedIssuesCount;

    return (
        <div
            ref={setNodeRef}
            className={`mb-6 bg-white rounded-lg shadow-sm border transition-all ${isOver ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-200' : 'border-gray-200'}`}
        >
            <SprintHeader
                sprint={sprint}
                onStart={() => setIsStartModalOpen(true)}
                onComplete={() => {
                    console.log('Sprint Issues for Completion:', sprint.issues?.map(i => ({
                        id: i.id,
                        title: i.title,
                        stageId: i.stage?.id,
                        stageName: i.stage?.name,
                        isFinal: i.stage?.isFinal
                    })));
                    setIsCompleteModalOpen(true);
                }}
                onEdit={() => onEditSprint && onEditSprint(sprint)}
                onDelete={() => onDeleteSprint && onDeleteSprint(sprint.id)}
                startDisabled={startDisabledReason}
            />

            {isExpanded && (
                <div className="p-4 min-h-[100px] bg-gray-50/50 rounded-b-lg">
                    {visibleIssues.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {visibleIssues.map((issue) => (
                                <DraggableSprintIssue
                                    key={issue.id}
                                    issue={issue}
                                    sprintId={sprint.id}
                                    stages={stages}
                                    onUpdateIssueStatus={sprint.status === 'ACTIVE' ? onUpdateIssueStatus : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={`flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg transition-colors ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200'}`}>
                            <div className={`p-3 rounded-full mb-2 ${isOver ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <p className={`text-sm font-medium ${isOver ? 'text-indigo-700' : 'text-gray-500'}`}>
                                {isOver ? 'Drop issue to add to sprint' : 'Drag issues here to plan'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <StartSprintModal
                isOpen={isStartModalOpen}
                onClose={() => setIsStartModalOpen(false)}
                onStart={handleStartSprint}
                sprintName={sprint.name}
                issueCount={sprint.issues?.length || 0}
            />

            <CompleteSprintModal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                onComplete={(action) => onCompleteSprint(sprint.id, action)}
                sprintName={sprint.name}
                completedCount={completedIssuesCount}
                incompleteCount={incompleteIssuesCount}
            />
        </div>
    );
};

export default SprintContainer;