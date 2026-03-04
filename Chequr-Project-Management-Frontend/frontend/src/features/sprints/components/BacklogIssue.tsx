import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Issue } from '../types';
import { Bug, Bookmark, CheckSquare, GripVertical, Circle, Disc, CheckCircle, User } from 'lucide-react';

interface BacklogIssueProps {
    issue: Issue;
    isBoardView?: boolean;
    onDelete?: (id: string) => void;
}

const BacklogIssue: React.FC<BacklogIssueProps> = ({ issue, isBoardView = false, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: issue.id,
        data: { issue }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        position: 'relative' as const,
        touchAction: 'none'
    } : undefined;

    const getTypeIcon = () => {
        switch (issue.type) {
            case 'BUG': return <Bug className="w-3.5 h-3.5 text-red-600" />;
            case 'STORY': return <Bookmark className="w-3.5 h-3.5 text-purple-600 fill-current" />;
            default: return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
        }
    };

    const getStatusStyle = (stageName: string) => {
        const s = stageName.toUpperCase();
        if (s.includes('TODO') || s.includes('BACKLOG')) return 'bg-gray-100 text-gray-600';
        if (s.includes('PROGRESS')) return 'bg-orange-50 text-orange-600';
        if (s.includes('REVIEW')) return 'bg-purple-50 text-purple-600';
        if (issue.stage?.isFinal || s.includes('DONE') || s.includes('COMPLETE')) return 'bg-green-50 text-green-600';
        return 'bg-blue-50 text-blue-600';
    };

    if (isBoardView) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`group flex flex-col gap-3 p-3 bg-white border rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md
                    ${isDragging ? 'shadow-lg ring-2 ring-indigo-400 rotate-2 border-indigo-400 opacity-90' : 'border-gray-200 hover:border-indigo-300'}
                `}
            >
                <div className="flex justify-between items-start w-full">
                    <span className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {issue.title}
                    </span>
                    <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md border ml-2 ${getStatusStyle(issue.stage?.name || 'todo')}`}>
                        {getTypeIcon()}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {issue.id.slice(0, 8)}
                        </span>
                    </div>

                    {issue.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs text-indigo-700 font-bold overflow-hidden" title={`${issue.assignee.firstName} ${issue.assignee.lastName}`}>
                            {issue.assignee.avatarUrl ? (
                                <img src={issue.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span>{(issue.assignee.firstName?.[0] || '') + (issue.assignee.lastName?.[0] || '')}</span>
                            )}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50" title="Unassigned">
                            <User className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`group flex items-center gap-3 p-3 bg-white border rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'shadow-lg ring-2 ring-indigo-400 rotate-1 border-indigo-400' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'}
            `}
        >
            <div className="text-gray-300 hover:text-indigo-400 transition-colors cursor-grab">
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded-lg ${getStatusStyle(issue.stage?.name || 'todo')} group-hover:scale-110 transition-transform`}>
                    {getTypeIcon()}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {issue.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${issue.priority === 'HIGH' ? 'text-red-500' : 'text-gray-400'}`}>
                            {issue.priority}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(issue.stage?.name || 'todo')}`}>
                    {(issue.stage?.name || 'todo').replace(/_/g, ' ')}
                </div>
                {issue.assignee ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs text-indigo-700 font-bold overflow-hidden" title={`${issue.assignee.firstName} ${issue.assignee.lastName}`}>
                        {issue.assignee.avatarUrl ? (
                            <img src={issue.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span>{(issue.assignee.firstName?.[0] || '') + (issue.assignee.lastName?.[0] || '')}</span>
                        )}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50" title="Unassigned">
                        <User className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>

            {
                onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(issue.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Issue"
                    >
                        <div className="w-4 h-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </div>
                    </button>
                )
            }
        </div>
    );
};

export default BacklogIssue;