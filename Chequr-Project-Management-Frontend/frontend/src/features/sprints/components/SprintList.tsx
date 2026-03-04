import React from 'react';
import { Sprint, SprintStatus } from '../types';
import SprintContainer from './SprintContainer';
import CreateSprintButton from './CreateSprintButton';

interface SprintListProps {
    sprints: Sprint[];
    projectId: string; // Needed for creation
    stages: any[];
    onCreateSprint: () => void;
    onStartSprint: (sprintId: string, startDate: string, endDate: string, goal: string) => void;
    onCompleteSprint: (sprintId: string, action: 'backlog' | 'new_sprint') => void;
    onUpdateIssueStatus?: (issueId: string, stageId: string) => void;
    onEditSprint?: (sprint: Sprint) => void;
    onDeleteSprint?: (sprintId: string) => void;
}

const SprintList: React.FC<SprintListProps> = ({
    sprints,
    projectId,
    stages,
    onCreateSprint,
    onStartSprint,
    onCompleteSprint,
    onUpdateIssueStatus,
    onEditSprint,
    onDeleteSprint
}) => {
    // Sort sprints: Active first, then Planned by createdAt (mock logic)
    const sortedSprints = [...sprints].sort((a, b) => {
        if (a.status === SprintStatus.ACTIVE) return -1;
        if (b.status === SprintStatus.ACTIVE) return 1;
        return 0;
    });

    const activeSprint = sprints.find(s => s.status === SprintStatus.ACTIVE);
    const activeSprintId = activeSprint?.id;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sprints</h2>
                <CreateSprintButton onClick={onCreateSprint} />
            </div>

            {sortedSprints.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-4">No sprints found for this project.</p>
                    <CreateSprintButton onClick={onCreateSprint} />
                </div>
            ) : (
                sortedSprints.map((sprint) => (
                    <SprintContainer
                        key={sprint.id}
                        sprint={sprint}
                        stages={stages}
                        onStartSprint={onStartSprint}
                        onCompleteSprint={onCompleteSprint}
                        activeSprintId={activeSprintId}
                        onUpdateIssueStatus={onUpdateIssueStatus}
                        onEditSprint={onEditSprint}
                        onDeleteSprint={onDeleteSprint}
                    />
                ))
            )}
        </div>
    );
};

export default SprintList;
