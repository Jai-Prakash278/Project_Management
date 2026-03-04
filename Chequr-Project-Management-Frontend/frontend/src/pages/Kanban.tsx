import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { Search, ChevronDown, Filter, Plus, UserPlus } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { toast } from 'react-hot-toast';
import KanbanBoard from '../components/kanban/KanbanBoard';
import CreateIssueDrawer from '../components/issues/CreateIssueDrawer';
import AssigneeFilter from '../components/kanban/AssigneeFilter';
import TypeFilter from '../components/kanban/TypeFilter';
import IssueDetailDrawer from '../components/issues/IssueDetailDrawer';
import { IssuePriority, IssueType, Issue, WorkflowMode } from '../types/issue.types';
import { GET_BOARD_ISSUES_QUERY } from '../graphql/issue.query';
import { GET_SPRINTS_QUERY } from '../graphql/sprint.query';
import { GET_PROJECTS_QUERY } from '../graphql/projects.query';
import { CREATE_ISSUE_MUTATION } from '../graphql/issue.mutation';
import { COMPLETE_SPRINT_MUTATION } from '../graphql/sprint.mutation';
import { CheckCircle2 } from 'lucide-react';


const Kanban: React.FC = () => {
    // 1. Fetch Projects to get a default project ID
    const { data: projectsData, loading: projectsLoading, error: projectsError } = useQuery<{ projects: any[] }>(GET_PROJECTS_QUERY);
    const projects = projectsData?.projects || [];
    const firstProjectId = projects[0]?.id || '';

    const [activeSprintId, setActiveSprintId] = useState<string>('all');
    const [isSprintOpen, setIsSprintOpen] = useState(false);
    const [items, setItems] = useState<Record<string, Issue[]>>({});
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerDefaultStatus, setDrawerDefaultStatus] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    // Detail Drawer States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [proposedStatus, setProposedStatus] = useState<string | undefined>(undefined);
    const [snapshotItems, setSnapshotItems] = useState<Record<string, Issue[]>>({});

    const activeProject = projects[0];

    // 2. Fetch Board Issues & Sprints for the selected project
    const { data: issuesData, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useQuery<{ getBoardIssues: any[] }, { projectId: string; sprintId?: string }>(GET_BOARD_ISSUES_QUERY, {
        variables: { projectId: firstProjectId, sprintId: activeSprintId },
        skip: !firstProjectId,
        fetchPolicy: 'network-only'
    });

    const { data: sprintsData, refetch: refetchSprints } = useQuery<{ getSprintsByProject: any[] }, { projectId: string }>(GET_SPRINTS_QUERY, {
        variables: { projectId: firstProjectId },
        skip: !firstProjectId,
    });

    const [createIssue] = useMutation(CREATE_ISSUE_MUTATION);
    const [completeSprint] = useMutation(COMPLETE_SPRINT_MUTATION);

    // Derived stages/columns
    const stages = useMemo(() => {
        const workflowStages = activeProject?.workflow?.stages;
        if (workflowStages && workflowStages.length > 0) {
            return [...workflowStages].sort((a, b) => a.orderIndex - b.orderIndex);
        }
        // Fallback to default stages if none defined
        return [
            { id: 'todo', name: 'Todo', orderIndex: 0 },
            { id: 'inprogress', name: 'In Progress', orderIndex: 1 },
            { id: 'blocked', name: 'Blocked', orderIndex: 2 },
            { id: 'inreview', name: 'In Review', orderIndex: 3 },
            { id: 'done', name: 'Done', orderIndex: 4 }
        ];
    }, [activeProject]);

    // Synchronize API data with local items state
    useEffect(() => {
        if (issuesData?.getBoardIssues) {
            const grouped: Record<string, Issue[]> = {};

            // Initialize groups for all stages
            stages.forEach(stage => {
                grouped[stage.id.toLowerCase()] = [];
            });


            issuesData.getBoardIssues.forEach((stage: any) => {
                const columnId = stage.id.toLowerCase();
                if (!grouped[columnId]) {
                    // This shouldn't happen with correct stages, but safety first
                    grouped[columnId] = [];
                }

                (stage.issues || []).forEach((issue: any, index: number) => {
                    try {
                        // Normalize assignee data
                        const assigneeId = issue.assignee?.id || null;
                        const assigneeName = issue.assignee
                            ? `${issue.assignee.firstName || ''} ${issue.assignee.lastName || ''}`.trim() || issue.assignee.username || 'Unnamed'
                            : null;

                        // Map GraphQL response to Issue interface
                        const mappedIssue: Issue & { assigneeName?: string | null; assigneeId?: string | null } = {
                            id: issue.id,
                            title: issue.title,
                            stageId: issue.stage?.id || issue.stageId,
                            stage: issue.stage,
                            priority: issue.priority as IssuePriority,
                            type: issue.type as IssueType,
                            boardOrder: issue.boardOrder || 0,
                            description: issue.description || '',
                            storyPoints: issue.storyPoints || 0,
                            dueDate: issue.dueDate ? issue.dueDate : undefined,
                            assignee: issue.assignee ? {
                                id: issue.assignee.id,
                                firstName: issue.assignee.firstName,
                                lastName: issue.assignee.lastName,
                                avatarUrl: issue.assignee.avatarUrl
                            } : undefined,
                            assigneeId: assigneeId ? String(assigneeId) : null,
                            assigneeName: assigneeName,
                            reporter: {
                                id: issue.reporter?.id || '',
                                firstName: issue.reporter?.firstName || 'System',
                                lastName: issue.reporter?.lastName || 'Reporter',
                                avatarUrl: issue.reporter?.avatarUrl
                            },
                            project: {
                                id: issue.project?.id || '',
                                name: issue.project?.name || 'Unknown Project',
                                workflow: activeProject?.workflow,
                            },
                            createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
                            updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
                            subtaskList: issue.subtaskList || [],
                            comments: [],
                            blockedReason: issue.blockedReason || '',
                            sprintId: issue.sprint?.id,
                            sprint: issue.sprint ? { id: issue.sprint.id, name: issue.sprint.name } : undefined,
                        };

                        grouped[columnId].push(mappedIssue as unknown as Issue);
                    } catch (err) {
                        console.error(`Error mapping issue at index ${index} in stage ${columnId}:`, err, issue);
                    }
                });
            });

            setItems(grouped);
        }
    }, [issuesData, stages]);


    const sprints = useMemo(() => {
        const baseSprints = [{ id: 'all', name: 'All Issues' }];
        if (sprintsData?.getSprintsByProject) {
            return [...baseSprints, ...sprintsData.getSprintsByProject];
        }
        return baseSprints;
    }, [sprintsData]);

    const activeSprintName = useMemo(() => {
        return sprints.find(s => s.id === activeSprintId)?.name || 'All Issues';
    }, [activeSprintId, sprints]);

    // Filter states
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<IssueType[]>([]);
    const [openFilter, setOpenFilter] = useState<'assignee' | 'type' | null>(null);

    const handleAddClick = (columnId: string) => {
        setDrawerDefaultStatus(columnId);
        setIsDrawerOpen(true);
    };

    const handleCreateIssue = async (issueData: any) => {
        if (!firstProjectId) return;
        try {
            // Defensive input construction
            const input: any = {
                title: issueData.title,
                description: issueData.description,
                stageId: issueData.stageId,
                priority: issueData.priority,
                type: issueData.type,
                projectId: firstProjectId,
                sprintId: activeSprintId === 'all' ? undefined : activeSprintId,
            };

            if (issueData.assigneeId) input.assigneeId = issueData.assigneeId;
            if (issueData.storyPoints) input.storyPoints = parseFloat(issueData.storyPoints);
            if (issueData.dueDate) input.dueDate = issueData.dueDate;

            await createIssue({
                variables: { input }
            });

            await refetchIssues();
            setIsDrawerOpen(false);
            toast.success('Issue created successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create issue');
        }
    };

    const handleMoveIssue = async (issueId: string, columnId: string, position: number, droppedIssue: Issue) => {
        // Same-column reorder — no drawer needed
    };

    const handleStageDrop = (droppedIssue: Issue, newStageId: string) => {
        setSelectedIssue(droppedIssue);
        setProposedStatus(newStageId);
        setIsDetailOpen(true);
    };

    const handleDragStart = () => {
        const copy: Record<string, Issue[]> = {};
        Object.keys(items).forEach(key => {
            copy[key] = [...items[key]];
        });
        setSnapshotItems(copy);
    };

    const handleIssueClick = (issue: Issue) => {
        setSelectedIssue(issue);
        setProposedStatus(undefined);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = (saved?: boolean) => {
        setIsDetailOpen(false);
        setSelectedIssue(null);
        if (saved) {
            refetchIssues();
        } else if (proposedStatus) {
            setItems(snapshotItems); // Revert optimistic update if cancelled
        }
        setProposedStatus(undefined); // ALWAYS clear proposed status
    };

    const handleCompleteSprint = async () => {
        if (activeSprintId === 'all') return;
        if (!window.confirm('Are you sure you want to complete this sprint? Incomplete issues will be moved to the backlog.')) return;

        try {
            await completeSprint({
                variables: {
                    sprintId: activeSprintId
                }
            });
            toast.success('Sprint completed successfully');
            setActiveSprintId('all');
            await refetchSprints();
            await refetchIssues();
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete sprint');
        }
    };

    if (projectsLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

    if (projectsError) return <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2"><p className="font-bold">Error loading projects</p><p className="text-sm">{projectsError.message}</p></div>;

    if (!firstProjectId) return <div className="flex items-center justify-center h-full text-gray-500">No projects found. Please create a project first.</div>;

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            <CreateIssueDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleCreateIssue}
                defaultStatus={drawerDefaultStatus}
                stages={stages}
            />

            {selectedIssue && (
                <IssueDetailDrawer
                    isOpen={isDetailOpen}
                    onClose={handleCloseDetail}
                    issue={selectedIssue}
                    proposedStageId={proposedStatus}
                    stages={stages}
                />
            )}

            {/* Top Header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Projects</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-medium">{activeProject?.name || 'Select Project'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
                        {/* Workflow Badge */}
                        {activeProject?.workflow && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                <div className={`w-2 h-2 rounded-full ${activeProject.workflow.transitionMode === WorkflowMode.SEQUENTIAL ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {activeProject.workflow.transitionMode === WorkflowMode.SEQUENTIAL ? 'Sequential Mode' : 'Flexible Mode'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {activeSprintId !== 'all' && (
                            <button
                                onClick={handleCompleteSprint}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-md active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Complete Sprint
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setDrawerDefaultStatus(undefined);
                                setIsDrawerOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Create Issue
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex items-center gap-4 mt-6">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search board..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2" />

                    <div className="flex items-center gap-2">
                        {/* Assignee Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenFilter(openFilter === 'assignee' ? null : 'assignee')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                                    ${selectedAssigneeIds.length > 0
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Assignee</span>
                                {selectedAssigneeIds.length > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                                        {selectedAssigneeIds.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${openFilter === 'assignee' ? 'rotate-180' : ''}`} />
                            </button>
                            {openFilter === 'assignee' && (
                                <AssigneeFilter
                                    selectedAssigneeIds={selectedAssigneeIds}
                                    onSelect={(assigneeIds: string[]) => {
                                        setSelectedAssigneeIds(assigneeIds);
                                        setOpenFilter(null);
                                    }}
                                    onClear={() => {
                                        setSelectedAssigneeIds([]);
                                        setOpenFilter(null);
                                    }}
                                    onClose={() => setOpenFilter(null)}
                                />
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                                    ${selectedTypes.length > 0
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Type</span>
                                {selectedTypes.length > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                                        {selectedTypes.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${openFilter === 'type' ? 'rotate-180' : ''}`} />
                            </button>
                            {openFilter === 'type' && (
                                <TypeFilter
                                    selectedTypes={selectedTypes}
                                    onApply={(selected) => {
                                        setSelectedTypes(selected);
                                        setOpenFilter(null);
                                    }}
                                    onClear={() => {
                                        setSelectedTypes([]);
                                        setOpenFilter(null);
                                    }}
                                    onClose={() => setOpenFilter(null)}
                                />
                            )}
                        </div>

                        <div className="h-4 w-px bg-gray-200 mx-1" />

                        {/* Sprint Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSprintOpen(!isSprintOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border
                                    ${activeSprintId !== 'all'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-100'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Sprints</span>
                                {activeSprintId !== 'all' && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                                        {activeSprintName}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSprintOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSprintOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-50 py-1 overflow-hidden">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Sprint</div>
                                    {sprints.map(sprint => (
                                        <button
                                            key={sprint.id}
                                            onClick={() => {
                                                setActiveSprintId(sprint.id);
                                                setIsSprintOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between font-medium ${activeSprintId === sprint.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                        >
                                            {sprint.name}
                                            {activeSprintId === sprint.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Board Area */}
            <div className="flex-1 min-h-0 bg-gray-50/50">
                {issuesLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <KanbanBoard
                        activeSprint={activeSprintId}
                        searchQuery={searchQuery}
                        items={items}
                        setItems={setItems}
                        onAddClick={handleAddClick}
                        onIssueMove={handleMoveIssue}
                        onStageDrop={handleStageDrop}
                        onDragStart={handleDragStart}
                        onIssueClick={handleIssueClick}
                        selectedAssigneeIds={selectedAssigneeIds}
                        selectedTypes={selectedTypes}
                        stages={stages}
                        workflow={activeProject?.workflow}
                    />
                )}
            </div>

        </div>
    );
};

export default Kanban;