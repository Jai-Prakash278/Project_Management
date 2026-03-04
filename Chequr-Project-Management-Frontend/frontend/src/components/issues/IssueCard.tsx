import React from 'react';
import {
    Calendar,
    AlertCircle,
    Clock
} from 'lucide-react';
import { Issue, IssueType, IssuePriority } from '../../types/issue.types';

interface IssueCardProps {
    issue: Issue;
    onClick?: (issue: Issue) => void;
}

const getStatusColor = (status: string) => {
    const s = String(status).toUpperCase();
    if (s.includes('TODO') || s.includes('BACKLOG')) return 'bg-gray-100 text-gray-600';
    if (s.includes('PROGRESS')) return 'bg-orange-50 text-orange-600';
    if (s.includes('REVIEW')) return 'bg-purple-50 text-purple-600';
    if (s.includes('DONE') || s.includes('COMPLETE')) return 'bg-green-50 text-green-600';
    return 'bg-blue-50 text-blue-600';
};

const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
    return (
        <div
            onClick={() => onClick?.(issue)}
            className={`bg-white px-6 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-indigo-300 transition-all duration-200 mb-3 flex items-center justify-between group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center gap-6 flex-1 min-w-0">
                {/* Project Info */}
                <div className="flex flex-col min-w-[80px]">
                    <span className="text-xs font-semibold text-gray-700">
                        {issue.project?.key || '---'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[120px]">
                        {issue.project?.name}
                    </span>
                </div>

                {/* Type Icon & Title */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${getStatusColor(issue.stage?.name || 'todo')} group-hover:scale-110 transition-transform`}>
                        {issue.type === IssueType.BUG ? <AlertCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {issue.title}
                    </h4>
                </div>
            </div>

            <div className="flex items-center gap-8 ml-4">
                {/* Due Date */}
                {issue.dueDate ? (
                    <div className="flex items-center gap-2 text-gray-500 min-w-[100px] justify-end">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                            {new Date(issue.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                ) : (
                    <div className="min-w-[100px]" />
                )}

                {/* Status Badge */}
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight min-w-[100px] text-center ${getStatusColor(issue.stage?.name || 'todo')}`}>
                    {(issue.stage?.name || 'todo').replace(/_/g, ' ')}
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
