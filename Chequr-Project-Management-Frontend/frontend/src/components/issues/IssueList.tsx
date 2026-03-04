import React from 'react';
import IssueCard from './IssueCard';
import { Issue } from '../../types/issue.types';

interface IssueListProps {
    issues: Issue[];
    onIssueClick?: (issue: Issue) => void;
    emptyMessage?: string;
}

const IssueList: React.FC<IssueListProps> = ({ issues, onIssueClick, emptyMessage }) => {
    if (issues.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">{emptyMessage || "No issues found."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onClick={onIssueClick} />
            ))}
        </div>
    );
};

export default IssueList;
