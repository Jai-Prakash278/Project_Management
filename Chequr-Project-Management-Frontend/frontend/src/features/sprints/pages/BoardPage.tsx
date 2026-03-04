import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Filter, Plus, UserPlus } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useQuery, useMutation } from '@apollo/client/react';

import KanbanBoard from '../../../components/kanban/KanbanBoard';
import CreateIssueDrawer from '../../../components/issues/CreateIssueDrawer';
import IssueDetailDrawer from '../../../components/issues/IssueDetailDrawer';
import AssigneeFilter from '../../../components/kanban/AssigneeFilter';
import TypeFilter from '../../../components/kanban/TypeFilter';
import { GET_BOARD_ISSUES_QUERY } from '../../../graphql/issue.query';
import { GET_SPRINTS_QUERY } from '../../../graphql/sprints.query';
import { CREATE_ISSUE_MUTATION, UPDATE_ISSUE_MUTATION, MOVE_ISSUE_MUTATION } from '../../../graphql/issue.mutation';
import { GET_PROJECT_QUERY, GET_WORKFLOW_TRANSITIONS_QUERY } from '../../../graphql/projects.query';
import { GET_MY_PROFILE_QUERY } from '../../../graphql/auth.query';
import { IssuePriority, IssueType, Issue, WorkflowStage, Transition, WorkflowMode } from '../../../types/issue.types';


const BoardPage: React.FC = () => {
    const navigate = useNavigate();
    const { projectId = '' } = useParams<{ projectId: string }>();
    const [activeSprintId, setActiveSprintId] = useState<string>('all');
    const [isSprintOpen, setIsSprintOpen] = useState(false);

    // Pre-warm stages from localStorage for instant zero-flash render
    const [stages, setStages] = useState<WorkflowStage[]>(() => {
        if (!projectId) return [];
        try {
            const cached = localStorage.getItem(`stages_${projectId}`);
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });
    const [items, setItems] = useState<Record<string, Issue[]>>({});

    // Drawer & Detail States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerDefaultStatus, setDrawerDefaultStatus] = useState<string | undefined>(undefined);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [snapshotItems, setSnapshotItems] = useState<Record<string, Issue[]>>({});
    const [proposedStatus, setProposedStatus] = useState<string | undefined>(undefined);

    // Filter states
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<IssueType[]>([]);
    const [openFilter, setOpenFilter] = useState<'assignee' | 'type' | null>(null);

    // Mutations
    const [createIssue] = useMutation(CREATE_ISSUE_MUTATION);
    const [updateIssue] = useMutation(UPDATE_ISSUE_MUTATION);
    const [moveIssue] = useMutation(MOVE_ISSUE_MUTATION);

    // 1. Fetch Sprints
    const { data: sprintsData } = useQuery<any>(GET_SPRINTS_QUERY, {
        variables: { projectId },
        skip: !projectId
    });

    const sprints = useMemo(() => {
        const baseSprints = [{ id: 'all', name: 'All Issues' }];
        const list = sprintsData?.getSprintsByProject || [];
        return [...baseSprints, ...list];
    }, [sprintsData]);

    const activeSprintName = useMemo(() => {
        return sprints.find((s: any) => s.id === activeSprintId)?.name || 'All Issues';
    }, [activeSprintId, sprints]);

    // 2. Fetch Issues
    const { data: issuesData, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useQuery<any>(GET_BOARD_ISSUES_QUERY, {
        variables: { projectId, sprintId: activeSprintId },
        skip: !projectId,
        fetchPolicy: 'cache-and-network'
    });

    // 3. Fetch Project Data (including workspace)
    const { data: projectData, loading: projectLoading, error: projectError } = useQuery<{ project: any }, { id: string }>(GET_PROJECT_QUERY, {
        variables: { id: projectId },
        skip: !projectId,
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first"
    });

    const workflowId = projectData?.project?.workflow?.id;

    const { data: transitionsData } = useQuery<any>(GET_WORKFLOW_TRANSITIONS_QUERY, {
        variables: { workflowId },
        skip: !workflowId,
    });

    const transitions: Transition[] = useMemo(() => {
        // Try to load from localStorage first (Frontend Shim Override)
        const localWorkflow = localStorage.getItem(`workflow_${projectId}`);
        if (localWorkflow) {
            try {
                const parsed = JSON.parse(localWorkflow);
                if (parsed.data?.transitions) {
                    return parsed.data.transitions.map((t: any) => ({
                        fromStageId: t.fromStageId || t.fromStage, // Handle different formats
                        toStageId: t.toStageId || t.toStage,
                        allowedRoles: t.allowedRoles || []
                    }));
                }
            } catch (e) {
                console.error("Error parsing local workflow", e);
            }
        }

        if (!transitionsData?.getWorkflowTransitions) return [];
        return transitionsData.getWorkflowTransitions.map((t: any) => ({
            fromStageId: t.fromStage?.id,
            toStageId: t.toStage?.id,
            allowedRoles: t.allowedRoles || []
        }));
    }, [transitionsData, projectId]);

    const { data: profileData } = useQuery<{ me: any }>(GET_MY_PROFILE_QUERY);

    const members = projectData?.project?.members || [];

    // 5. Compute Workflow (Trust Backend > Local Shim, with Sticky Stability)
    const [stableWorkflow, setStableWorkflow] = useState<any>(null);

    // Senior Architect Fixes: Stable Loading Flags
    const workflow = projectData?.project?.workflow || stableWorkflow;
    const isWorkflowLoading = projectLoading || (!workflow && !projectData);

    // Update stable workflow when source data changes
    useEffect(() => {
        const backendWorkflow = projectData?.project?.workflow;
        const localWorkflowStr = localStorage.getItem(`workflow_${projectId}`);

        let localWorkflow: any = null;
        if (localWorkflowStr) {
            try {
                localWorkflow = JSON.parse(localWorkflowStr);
            } catch (e) { }
        }

        const defaultSequential = {
            id: 'default',
            transitionMode: WorkflowMode.SEQUENTIAL,
            stages: []
        };

        let current: any = null;

        if (backendWorkflow) {
            const isBackendDefault = backendWorkflow.isDefault || !backendWorkflow.name?.includes('Custom');
            const mode = (isBackendDefault && localWorkflow?.data?.transitionMode === WorkflowMode.FLEXIBLE)
                ? WorkflowMode.FLEXIBLE
                : (backendWorkflow.transitionMode || WorkflowMode.SEQUENTIAL);

            current = {
                ...backendWorkflow,
                transitionMode: mode
            };
        } else if (localWorkflow) {
            current = {
                id: 'local-workflow',
                transitionMode: localWorkflow.data?.transitionMode || WorkflowMode.SEQUENTIAL,
                stages: localWorkflow.data?.stages || []
            };
        }

        // Only update if fundamentally changed or if we don't have one yet
        if (current && JSON.stringify(current) !== JSON.stringify(stableWorkflow)) {
            setStableWorkflow(current);
        } else if (!current && !stableWorkflow && !projectLoading) {
            setStableWorkflow(defaultSequential);
        }
    }, [projectData?.project?.workflow, projectId, projectLoading]);

    // 4. Handle Stages (Workflow) - ARCHITECTURAL FIX: Dependency stability & JSON Comparison
    useEffect(() => {
        if (!projectData?.project) return;

        const projectWorkflow = projectData.project.workflow;
        let newStages: WorkflowStage[] = [];

        // PRIORITIZE Local Shim Fallback first for custom flexible workflows
        const localWorkflowStr = localStorage.getItem(`workflow_${projectId}`);
        if (localWorkflowStr) {
            try {
                const localWorkflow = JSON.parse(localWorkflowStr);
                const localMode = localWorkflow.data?.transitionMode || localWorkflow.transitionMode;
                const localStages = localWorkflow.data?.stages || localWorkflow.stages;

                if (localMode === WorkflowMode.FLEXIBLE && localStages && localStages.length > 0) {
                    const backendStages = projectWorkflow?.stages || [];
                    const normalize = (n: string) => (n || '').toLowerCase().trim().replace(/\s+/g, '');

                    newStages = localStages.map((s: any, idx: number) => {
                        const backendMatch = backendStages.find((bs: any) => normalize(bs.name) === normalize(s.name));
                        const finalId = backendMatch?.id || s.id || `local-${idx}`;
                        return {
                            id: finalId,
                            name: s.name,
                            orderIndex: s.orderIndex ?? idx,
                        };
                    });
                }
            } catch (e) { }
        }

        // Fallback to Backend Stages if local shim didn't populate
        if (newStages.length === 0) {
            if (projectWorkflow?.stages?.length > 0) {
                newStages = [...projectWorkflow.stages].sort((a, b) => a.orderIndex - b.orderIndex);
            } else if (projectWorkflow === undefined) {
                // PARTIAL CACHE HIT: Another query updated Project cache without workflow.
                // Keep existing stages — don't clear.
                return;
            }
        }

        // Only update if data actually changed to prevent flickering during refetch
        if (newStages.length > 0) {
            setStages(prev => {
                if (JSON.stringify(prev) === JSON.stringify(newStages)) return prev;
                // Persist to localStorage for instant zero-flash render on next visit
                localStorage.setItem(`stages_${projectId}`, JSON.stringify(newStages));
                return newStages;
            });
        }
    }, [projectData?.project, projectId]);

    // 5. Transform Issues to Board Columns
    useEffect(() => {
        if (issuesData?.getBoardIssues) {
            // New nested structure handling
            const grouped: Record<string, Issue[]> = {};
            stages.forEach((stage: WorkflowStage) => {
                grouped[stage.id.toLowerCase()] = [];
            });

            issuesData.getBoardIssues.forEach((stage: any) => {
                let columnId = stage.id.toLowerCase();

                // FLEXIBLE MODE MAPPING FIX:
                // If the stage ID from backend doesn't match any of our (shim) stages,
                // try to find a shim stage with the same NAME.
                if (!grouped[columnId]) {
                    const normalize = (n: string) => (n || '').toLowerCase().trim().replace(/\s+/g, '');
                    const backendNameNormalized = normalize(stage.name);

                    // Find if any of our 'stages' (which might have backend IDs or local IDs)
                    // matches this backend stage name.
                    const matchedStage = stages.find((s: WorkflowStage) => normalize(s.name) === backendNameNormalized);

                    if (matchedStage) {
                        columnId = matchedStage.id.toLowerCase();
                        // Also initialize the group if it doesn't exist yet for this mapped ID
                        if (!grouped[columnId]) grouped[columnId] = [];
                        console.log(`[Board] Mapping backend stage "${stage.name}" (${stage.id}) to shim stage "${matchedStage.name}" (${matchedStage.id})`);
                    }
                }

                if (!grouped[columnId]) {
                    grouped[columnId] = [];
                }

                (stage.issues || []).forEach((issue: any) => {
                    // Client-side sprint filter
                    if (activeSprintId !== 'all' && issue.sprint?.id !== activeSprintId) {
                        return;
                    }

                    // Normalize assignee data
                    const assigneeId = issue.assignee?.id ? String(issue.assignee.id) : null;
                    const assigneeName = issue.assignee
                        ? `${issue.assignee.firstName || ''} ${issue.assignee.lastName || ''}`.trim() || issue.assignee.username || 'Unnamed'
                        : null;

                    grouped[columnId].push({
                        ...issue,
                        id: issue.id,
                        stageId: columnId,
                        priority: issue.priority as IssuePriority,
                        type: issue.type as IssueType,
                        assigneeId: assigneeId,
                        assigneeName: assigneeName,
                        project: {
                            id: issue.project?.id || projectId,
                            name: issue.project?.name || projectData?.project?.name || 'Unknown Project',
                            workflow: workflow,
                        },
                        reporter: {
                            id: issue.reporter?.id || '',
                            firstName: issue.reporter?.firstName || 'System',
                            lastName: issue.reporter?.lastName || 'Reporter',
                            avatarUrl: issue.reporter?.avatarUrl
                        },
                        sprint: issue.sprint ? { id: issue.sprint.id, name: issue.sprint.name } : undefined,
                        createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
                        updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
                    } as unknown as Issue);
                });
            });

            setItems(prevItems => {
                // Preserve assignees from previous state if new data from cache has none
                // This prevents the avatar flickering when Apollo cache partial-updates occur
                const prevIssueMap: Record<string, any> = {};
                Object.values(prevItems).forEach(issueList => {
                    issueList.forEach(i => { prevIssueMap[i.id] = i; });
                });

                // Restore cached assignee if new data has none (partial cache hit)
                Object.keys(grouped).forEach(colId => {
                    grouped[colId] = grouped[colId].map(issue => {
                        const prev = prevIssueMap[issue.id];
                        if (!issue.assignee && prev?.assignee) {
                            return { ...issue, assignee: prev.assignee, assigneeId: prev.assigneeId, assigneeName: prev.assigneeName };
                        }
                        return issue;
                    });
                });

                return grouped;
            });
        } else if (issuesData?.getIssuesByProject) {
            // Legacy flat structure handling
            const allIssues = issuesData.getIssuesByProject || [];
            const grouped: Record<string, Issue[]> = {};
            stages.forEach((stage: WorkflowStage) => {
                grouped[stage.id.toLowerCase()] = [];
            });

            allIssues.forEach((issue: any) => {
                let columnId = issue.stage?.id?.toLowerCase() || issue.stageId?.toLowerCase();

                // FLEXIBLE MODE MAPPING FIX (Legacy):
                if (columnId && !grouped[columnId]) {
                    const normalize = (n: string) => (n || '').toLowerCase().replace(/\s+/g, '');
                    const backendStageName = issue.stage?.name || '';
                    if (backendStageName) {
                        const backendNameNormalized = normalize(backendStageName);
                        const matchedStage = stages.find((s: WorkflowStage) => normalize(s.name) === backendNameNormalized);
                        if (matchedStage) {
                            columnId = matchedStage.id.toLowerCase();
                        }
                    }
                }

                if (!columnId || !grouped[columnId]) {
                    columnId = stages[0]?.id?.toLowerCase();
                }

                if (columnId && grouped[columnId]) {
                    if (activeSprintId !== 'all' && issue.sprint?.id !== activeSprintId) {
                        return;
                    }

                    const assigneeId = issue.assignee?.id ? String(issue.assignee.id) : null;
                    const assigneeName = issue.assignee
                        ? `${issue.assignee.firstName || ''} ${issue.assignee.lastName || ''}`.trim() || issue.assignee.username || 'Unnamed'
                        : null;

                    grouped[columnId].push({
                        ...issue,
                        id: issue.id,
                        stageId: columnId,
                        priority: issue.priority as IssuePriority,
                        type: issue.type as IssueType,
                        assigneeId: assigneeId,
                        assigneeName: assigneeName,
                        project: {
                            id: issue.project?.id || projectId,
                            name: issue.project?.name || projectData?.project?.name || 'Unknown Project',
                            workflow: workflow,
                        },
                        reporter: {
                            id: issue.reporter?.id || '',
                            firstName: issue.reporter?.firstName || 'System',
                            lastName: issue.reporter?.lastName || 'Reporter',
                            avatarUrl: issue.reporter?.avatarUrl
                        },
                        sprint: issue.sprint ? { id: issue.sprint.id, name: issue.sprint.name } : undefined,
                        createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
                        updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
                    } as unknown as Issue);
                }
            });

            setItems(grouped);
        }
    }, [issuesData, activeSprintId, stages, projectId, projectData, workflow]);


    const handleAddClick = (columnId: string) => {
        setDrawerDefaultStatus(columnId);
        setIsDrawerOpen(true);
    };

    const isValidUUID = (value: string | undefined) => {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    };

    const handleCreateIssue = async (issueData: any) => {
        try {
            // MAP SHIM ID TO REAL BACKEND ID IF NECESSARY
            let finalStageId = issueData.stageId;
            if (finalStageId && finalStageId.startsWith('local-')) {
                const targetStage = stages.find((s: WorkflowStage) => s.id === finalStageId);
                if (targetStage && !targetStage.id.startsWith('local-')) {
                    finalStageId = targetStage.id;
                } else if (!isValidUUID(finalStageId)) {
                    // If we can't find a backend ID, let it be null so backend picks default
                    finalStageId = null;
                }
            }

            await createIssue({
                variables: {
                    input: {
                        projectId,
                        title: issueData.title,
                        type: issueData.type,
                        priority: issueData.priority,
                        stageId: isValidUUID(finalStageId) ? finalStageId : null,
                        sprintId: activeSprintId === 'all' ? null : activeSprintId,
                        assigneeId: issueData.assigneeId === 'unassigned' ? null : issueData.assigneeId,
                        description: issueData.description || '',
                        storyPoints: issueData.storyPoints || 0,
                        dueDate: issueData.dueDate || null,
                    }
                }
            });
            toast.success('Issue created successfully');
            setIsDrawerOpen(false);
            refetchIssues();
        } catch (error) {
            console.error('Error creating issue:', error);
            toast.error('Failed to create issue');
        }
    };

    const handleIssueMove = async (issueId: string, stageId: string, position: number, issue: Issue) => {
        // Same-column reorder only — cross-column drags go through drawer confirmation
        try {
            await moveIssue({
                variables: {
                    input: {
                        issueId,
                        stageId,
                        position
                    }
                }
            });
            await refetchIssues();
            toast.success('Status updated');
        } catch (error) {
            console.error('Error moving issue:', error);
            toast.error('Failed to update issue order');
            refetchIssues(); // Revert on error
        }
    };

    // Cross-column drag: open the drawer with the proposed new stage for confirmation
    const handleStageDrop = (issue: Issue, newStageId: string) => {
        setSelectedIssue(issue);
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

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            <CreateIssueDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleCreateIssue}
                defaultStatus={drawerDefaultStatus}
                members={members}
                stages={stages}
            />

            {selectedIssue && (
                <IssueDetailDrawer
                    isOpen={isDetailOpen}
                    onClose={(saved) => {
                        setIsDetailOpen(false);
                        setSelectedIssue(null);
                        if (saved) {
                            refetchIssues();
                        } else if (proposedStatus) {
                            setItems(snapshotItems);
                        }
                        setProposedStatus(undefined); // ALWAYS clear proposed status
                    }}
                    onDelete={() => {
                        setIsDetailOpen(false);
                        setSelectedIssue(null);
                        refetchIssues();
                    }}
                    issue={selectedIssue}
                    proposedStageId={proposedStatus}
                    stages={stages}
                />
            )}

            {/* Filters & Search Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>

                    {/* Workflow Mode Badge */}
                    {workflow && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className={`w-2 h-2 rounded-full ${workflow.transitionMode === WorkflowMode.SEQUENTIAL ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                {workflow.transitionMode === WorkflowMode.SEQUENTIAL ? 'Sequential Workflow' : 'Flexible Workflow'}
                            </span>
                        </div>
                    )}

                    <div className="h-8 w-[1px] bg-gray-200 mx-2" />

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

                        <div className="h-4 w-[1px] bg-gray-200 mx-1" />

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
                                    {sprints.map((sprint: any) => (
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

                    <button
                        onClick={() => {
                            setDrawerDefaultStatus(undefined);
                            setIsDrawerOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 ml-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Create Issue
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-gray-50/50 w-full overflow-x-auto">
                {issuesLoading || isWorkflowLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                        <p className="text-sm font-medium text-gray-500">Loading issues...</p>
                    </div>
                ) : !workflow ? (
                    null // Wait for workflow metadata to stabilize
                ) : stages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
                            <Plus className="w-8 h-8 rotate-45" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Workflow Configured</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                            This project doesn't have any workflow stages configured.
                            Issues cannot be displayed on the board without stages.
                        </p>
                        <button
                            onClick={() => navigate(`/project/${projectId}`)}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            Configure Workflow in Details
                        </button>
                    </div>
                ) : stages.length === 0 ? (
                    // Project loaded but has no workflow stages
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No workflow stages configured</p>
                        <p className="text-xs text-gray-400">Go to Project Settings to set up a workflow for this project.</p>
                    </div>
                ) : (
                    <KanbanBoard
                        stages={stages}
                        activeSprint={activeSprintId}
                        searchQuery={searchQuery}
                        items={items}
                        setItems={setItems}
                        onAddClick={handleAddClick}
                        onIssueMove={handleIssueMove}
                        onStageDrop={handleStageDrop}
                        onDragStart={handleDragStart}
                        selectedAssigneeIds={selectedAssigneeIds}
                        selectedTypes={selectedTypes}
                        onIssueClick={handleIssueClick}
                        workflow={workflow}
                        transitions={transitions}
                        currentUserRoles={
                            profileData?.me?.roles
                                ? profileData.me.roles.map((r: any) =>
                                    typeof r === 'string' ? r : (r?.role?.key || r?.key || '')
                                ).filter(Boolean)
                                : []
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default BoardPage;