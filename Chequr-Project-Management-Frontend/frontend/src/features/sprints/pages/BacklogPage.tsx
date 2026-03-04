import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor, useDroppable, DragOverlay } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import SprintList from '../components/SprintList';
import BacklogIssue from '../components/BacklogIssue';
import CreateSprintModal from '../components/CreateSprintModal';
import CreateIssueDrawer from '../../../components/issues/CreateIssueDrawer';
import EditSprintModal from '../components/EditSprintModal';
import { useSprints } from '../hooks/useSprints';
import { Sprint } from '../types';

import { GET_PROJECT_QUERY } from '../../../graphql/projects.query';
import { useQuery } from '@apollo/client/react';
import { confirmToast } from '../../../utils/toast.utils';

const BacklogPage: React.FC = () => {
    const { projectId = '' } = useParams<{ projectId: string }>();

    // Fetch Project Members
    const { data: projectData } = useQuery<any>(GET_PROJECT_QUERY, {
        variables: { id: projectId },
        skip: !projectId
    });
    const members = projectData?.project?.members || [];

    const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
    const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
    const [activeIssue, setActiveIssue] = useState<any>(null);

    // Edit Sprint State
    const [isEditSprintModalOpen, setIsEditSprintModalOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

    const {
        sprints,
        backlogIssues,
        loading,
        createSprint,
        startSprint,
        completeSprint,
        updateSprint,
        deleteSprint,
        createIssue,
        moveIssueToSprint,
        updateIssueStatus,
        deleteIssue
    } = useSprints(projectId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleEditSprint = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setIsEditSprintModalOpen(true);
    };

    const handleDeleteSprint = async (sprintId: string) => {
        const confirmed = await confirmToast(
            'Delete Sprint',
            'Are you sure you want to delete this sprint? All issues will be moved to backlog.',
            'delete'
        );
        if (confirmed) {
            deleteSprint(sprintId);
        }
    };

    const handleDeleteIssue = async (issueId: string) => {
        const confirmed = await confirmToast(
            'Delete Issue',
            'Are you sure you want to delete this issue? This action cannot be undone.',
            'delete'
        );
        if (confirmed) {
            deleteIssue(issueId);
        }
    };

    const onDragStart = (event: DragStartEvent) => {
        setActiveIssue(event.active.data?.current?.issue || null);
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveIssue(null);
        const { active, over } = event;
        if (!over) return;

        const issueId = active.id as string;
        const targetId = over.id as string;
        const fromSprintId = active.data?.current?.fromSprintId as string | undefined;

        // Same location — no-op
        if (targetId === fromSprintId) return;
        // Backlog issue dropped back on backlog — no-op
        if (targetId === 'backlog-area' && !fromSprintId) return;

        if (targetId === 'backlog-area') {
            // Sprint → Backlog
            moveIssueToSprint(issueId, null);
        } else {
            // Backlog → Sprint OR Sprint → Sprint
            moveIssueToSprint(issueId, targetId);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="h-full flex flex-col bg-white">
                {/* Header section for professional feel */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span>Projects</span>
                            <span>/</span>
                            <span className="font-medium text-gray-700">{projectData?.project?.name || '...'}</span>
                        </nav>
                        <h1 className="text-xl font-bold text-gray-900">Backlog</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-2">
                            {members.slice(0, 5).map((m: any) => (
                                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden" title={`${m.firstName} ${m.lastName}`}>
                                    {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : m.firstName?.[0]}
                                </div>
                            ))}
                            {members.length > 5 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                    +{members.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
                    {loading && sprints.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : (
                        <>
                            {/* Sprints Section (Active & Planned) */}
                            <section>
                                <SprintList
                                    sprints={sprints}
                                    projectId={projectId}
                                    stages={projectData?.project?.workflow?.stages || []}
                                    onCreateSprint={() => setIsCreateSprintModalOpen(true)}
                                    onStartSprint={startSprint}
                                    onCompleteSprint={completeSprint}
                                    onUpdateIssueStatus={updateIssueStatus}
                                    onEditSprint={handleEditSprint}
                                    onDeleteSprint={handleDeleteSprint}
                                />
                            </section>

                            {/* Backlog Section */}
                            <BacklogDropArea
                                issues={backlogIssues}
                                onOpenCreateIssue={() => setIsCreateIssueModalOpen(true)}
                                onDeleteIssue={handleDeleteIssue}
                            />
                        </>
                    )}

                    <CreateSprintModal
                        isOpen={isCreateSprintModalOpen}
                        onClose={() => setIsCreateSprintModalOpen(false)}
                        onCreate={createSprint}
                    />

                    <EditSprintModal
                        isOpen={isEditSprintModalOpen}
                        onClose={() => setIsEditSprintModalOpen(false)}
                        onUpdate={updateSprint}
                        sprint={editingSprint}
                    />

                    <CreateIssueDrawer
                        isOpen={isCreateIssueModalOpen}
                        onClose={() => setIsCreateIssueModalOpen(false)}
                        onSubmit={async (issueData) => {
                            await createIssue(issueData);
                            setIsCreateIssueModalOpen(false);
                        }}
                        members={members}
                        stages={projectData?.project?.workflow?.stages || []}
                    />
                </div>
            </div>

            {/* Floating drag card */}
            <DragOverlay>
                {activeIssue ? (
                    <div className="p-3 border border-indigo-400 rounded-lg bg-white shadow-2xl ring-2 ring-indigo-300 opacity-95 rotate-1 cursor-grabbing w-72">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${activeIssue.type === 'BUG' ? 'bg-red-50 text-red-600 border-red-100' :
                                activeIssue.type === 'STORY' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>{activeIssue.type || 'TASK'}</span>
                            <span className="text-xs text-gray-400 font-mono">{activeIssue.id?.slice(0, 8)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{activeIssue.title}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// Helper component for Backlog Droppable Area
interface BacklogDropAreaProps {
    issues: any[]; // Replace with Issue[]
    onOpenCreateIssue: () => void;
    onDeleteIssue: (id: string) => void;
}

const BacklogDropArea: React.FC<BacklogDropAreaProps> = ({ issues, onOpenCreateIssue, onDeleteIssue }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'backlog-area',
    });

    return (
        <section ref={setNodeRef} className={`rounded-lg transition-colors ${isOver ? 'ring-2 ring-indigo-200 bg-indigo-50/30' : ''}`}>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase text-gray-500 tracking-wider">Backlog</h2>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        {issues.length} issues
                    </span>
                </div>
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md transition-all shadow-sm active:transform active:scale-95"
                    onClick={onOpenCreateIssue}
                >
                    <Plus className="w-4 h-4" />
                    Create Issue
                </button>
            </div>

            <div className={`bg-white rounded-lg border overflow-hidden min-h-[200px] shadow-sm ${isOver ? 'border-indigo-500' : 'border-gray-200'}`}>
                {issues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="p-3 bg-gray-50 rounded-full mb-3">
                            <Plus className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Backlog is empty</h3>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                            Issues created in the backlog without a sprint will appear here.
                        </p>
                        <button
                            className="text-blue-600 text-sm font-medium hover:underline"
                            onClick={onOpenCreateIssue}
                        >
                            + Create your first issue
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {issues.map((issue) => (
                            <div key={issue.id} className="p-2 hover:bg-gray-50">
                                <BacklogIssue key={issue.id} issue={issue} onDelete={onDeleteIssue} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default BacklogPage;