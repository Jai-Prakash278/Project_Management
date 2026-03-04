import { useState, useCallback, useMemo } from 'react';

import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Sprint, SprintStatus, Issue } from '../types';
import { GET_SPRINTS_QUERY } from '../../../graphql/sprints.query';
import { GET_BACKLOG_ISSUES_QUERY } from '../../../graphql/issue.query';
import {
    CREATE_SPRINT_MUTATION,
    START_SPRINT_MUTATION,
    COMPLETE_SPRINT_MUTATION,
    UPDATE_SPRINT_MUTATION,
    DELETE_SPRINT_MUTATION
} from '../../../graphql/sprint.mutation';
import {
    CREATE_ISSUE_MUTATION,
    UPDATE_ISSUE_MUTATION,
    DELETE_ISSUE_MUTATION,
    MOVE_ISSUE_MUTATION
} from '../../../graphql/issue.mutation';
import { toast } from 'react-hot-toast';

interface CreateSprintData {
    createSprint: Sprint;
}

interface CreateSprintVars {
    input: {
        projectId: string;
        name: string;
        startDate?: string;
        endDate?: string;
        goal?: string;
    };
}

export const useSprints = (projectId: string) => {
    // 1. Fetch Sprints
    const {
        data: sprintsData,
        loading: sprintsLoading,
        error: sprintsError,
        refetch: refetchSprints
    } = useQuery<any>(GET_SPRINTS_QUERY, {
        variables: { projectId },
        skip: !projectId,
        fetchPolicy: 'network-only' // Ensure fresh data
    });

    const {
        data: backlogData,
        loading: backlogLoading,
        error: backlogError,
        refetch: refetchBacklog
    } = useQuery<any>(GET_BACKLOG_ISSUES_QUERY, {
        variables: { projectId },
        skip: !projectId,
        fetchPolicy: 'network-only'
    });

    // Mutations
    const [createSprintMutation] = useMutation<CreateSprintData, CreateSprintVars>(CREATE_SPRINT_MUTATION);
    const [startSprintMutation] = useMutation(START_SPRINT_MUTATION);
    const [completeSprintMutation] = useMutation(COMPLETE_SPRINT_MUTATION);
    const [updateSprintMutation] = useMutation(UPDATE_SPRINT_MUTATION);
    const [deleteSprintMutation] = useMutation(DELETE_SPRINT_MUTATION);
    const [createIssueMutation] = useMutation(CREATE_ISSUE_MUTATION);
    const [updateIssueMutation] = useMutation(UPDATE_ISSUE_MUTATION);
    const [deleteIssueMutation] = useMutation(DELETE_ISSUE_MUTATION);
    const [moveIssueMutation] = useMutation(MOVE_ISSUE_MUTATION);

    // Transform data
    const sprints: Sprint[] = useMemo(() => {
        if (!sprintsData?.getSprintsByProject) return [];
        return sprintsData.getSprintsByProject.map((s: any) => ({
            ...s,
            issues: s.issues || []
        }));
    }, [sprintsData]);

    // Backlog issues
    const backlogIssues = useMemo(() => {
        const issues = backlogData?.getIssuesByProject || [];
        // Client-side filter for backlog:
        // 1. Must not belong to an active/planned sprint
        // 2. Must not be in a final "Done" stage
        return issues.filter((i: any) => {
            if (i.sprint || i.sprintId) return false;

            // Check if it's considered done
            const isFinal = i.stage?.isFinal;
            const stageName = (i.stage?.name || '').toUpperCase();
            const isDoneByName = stageName.includes('DONE') || stageName.includes('COMPLETE');

            return !(isFinal || isDoneByName);
        });
    }, [backlogData]);

    const loading = sprintsLoading || backlogLoading;

    // Actions
    const createSprint = useCallback(async (name: string, startDate?: string, endDate?: string, goal?: string) => {
        if (!name.trim()) return;
        try {
            const { data } = await createSprintMutation({
                variables: {
                    input: {
                        projectId,
                        name,
                        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        goal
                    }
                }
            });
            if (data?.createSprint) {
                toast.success('Sprint created successfully');
                refetchSprints();
            }
        } catch (error: any) {
            console.error("Failed to create sprint:", error);
            toast.error(error.message || 'Failed to create sprint');
        }
    }, [projectId, createSprintMutation, refetchSprints]);

    const startSprint = useCallback(async (sprintId: string, startDate: string, endDate: string, goal?: string) => {
        try {
            await startSprintMutation({
                variables: {
                    input: {
                        sprintId,
                        startDate: new Date(startDate).toISOString(), // Ensure ISO string
                        endDate: new Date(endDate).toISOString(),
                        goal
                    }
                }
            });
            toast.success('Sprint started successfully');
            refetchSprints();
        } catch (error: any) {
            console.error("Failed to start sprint:", error);
            toast.error(error.message || 'Failed to start sprint');
        }
    }, [startSprintMutation, refetchSprints]);

    const completeSprint = useCallback(async (sprintId: string, action: 'backlog' | 'new_sprint') => {
        try {
            await completeSprintMutation({
                variables: { sprintId }
            });
            toast.success('Sprint completed successfully');
            refetchSprints();
            refetchBacklog();
        } catch (error: any) {
            console.error("Failed to complete sprint:", error);
            toast.error(error.message || 'Failed to complete sprint');
        }
    }, [completeSprintMutation, refetchSprints, refetchBacklog]);

    const updateSprint = useCallback(async (sprintId: string, data: Partial<Sprint>) => {
        try {
            await updateSprintMutation({
                variables: {
                    input: {
                        sprintId,
                        name: data.name,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        goal: data.goal
                    }
                }
            });
            toast.success('Sprint updated successfully');
            refetchSprints();
        } catch (error: any) {
            console.error("Failed to update sprint:", error);
            toast.error(error.message || 'Failed to update sprint');
        }
    }, [updateSprintMutation, refetchSprints]);

    const deleteSprint = useCallback(async (sprintId: string) => {
        try {
            await deleteSprintMutation({
                variables: { sprintId }
            });
            toast.success('Sprint deleted successfully');
            refetchSprints();
            refetchBacklog(); // Update backlog as issues moved there
        } catch (error: any) {
            console.error("Failed to delete sprint:", error);
            toast.error(error.message || 'Failed to delete sprint');
        }
    }, [deleteSprintMutation, refetchSprints, refetchBacklog]);

    const createIssue = useCallback(async (issueData: any) => {
        try {
            const { data } = await createIssueMutation({
                variables: {
                    input: {
                        projectId,
                        title: issueData.title,
                        type: issueData.type,
                        priority: issueData.priority,
                        // status: issueData.status || 'TODO', // Removed as it's not in CreateIssueInput
                        description: issueData.description,
                        assigneeId: issueData.assigneeId,
                        storyPoints: issueData.storyPoints ? Number(issueData.storyPoints) : null,
                        dueDate: issueData.dueDate,
                        sprintId: issueData.sprintId || null // Explicitly null for backlog
                    }
                }
            });
            console.log('Issue created successfully, response:', data);
            refetchBacklog();
            toast.success('Issue created successfully');
        } catch (error: any) {
            console.error("Failed to create issue:", error);
            toast.error(error.message || 'Failed to create issue');
        }
    }, [projectId, createIssueMutation, refetchBacklog]);


    const moveIssueToSprint = useCallback(async (issueId: string, sprintId: string | null) => {
        try {
            await updateIssueMutation({
                variables: {
                    input: {
                        issueId,
                        sprintId
                    }
                }
            });
            toast.success(sprintId ? 'Issue moved to sprint' : 'Issue moved to backlog');
            refetchSprints();
            refetchBacklog();
        } catch (error: any) {
            console.error("Failed to move issue:", error);
            toast.error(error.message || 'Failed to move issue');
        }
    }, [updateIssueMutation, refetchSprints, refetchBacklog]);

    const client = useApolloClient();

    const updateIssueStatus = useCallback(async (issueId: string, stageId: string) => {
        try {
            // Predict the exact return footprint
            const existingIssue = client.readFragment({
                id: `Issue:${issueId}`,
                fragment: gql`
                    fragment IssueData on Issue {
                        id
                        title
                        boardOrder
                        dueDate
                        updatedAt
                        sprint { id name status }
                    }
                `
            });
            const existingStage = client.readFragment({
                id: `WorkflowStage:${stageId}`,
                fragment: gql`fragment StageData on WorkflowStage { id name isFinal }`
            });

            await moveIssueMutation({
                variables: {
                    input: {
                        issueId,
                        stageId
                    }
                },
                optimisticResponse: existingIssue && existingStage ? {
                    moveIssue: {
                        __typename: "Issue",
                        ...existingIssue,
                        stage: existingStage
                    }
                } : undefined
            });
            refetchSprints();
            refetchBacklog();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error('Failed to update issue status');
        }
    }, [moveIssueMutation, refetchSprints, refetchBacklog]);


    const deleteIssue = useCallback(async (issueId: string) => {
        try {
            await deleteIssueMutation({
                variables: { id: issueId }
            });
            toast.success('Issue deleted successfully');
            refetchBacklog();
            refetchSprints();
        } catch (error: any) {
            console.error("Failed to delete issue:", error);
            toast.error(error.message || 'Failed to delete issue');
        }
    }, [deleteIssueMutation, refetchBacklog, refetchSprints]);

    return {
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
    };
};