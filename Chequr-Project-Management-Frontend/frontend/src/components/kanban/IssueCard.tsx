import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { IssueType, IssuePriority, User } from '../../types/issue.types';

interface IssueCardProps {
    id: string;
    title: string;
    type: IssueType;
    priority: IssuePriority;
    assignee?: User;
    subtasks?: number;
    comments?: number;
    onClick?: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({
    id,
    title,
    type,
    priority,
    assignee,
    subtasks = 0,
    onClick,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getTypeStyles = (type: IssueType) => {
        switch (type) {
            case IssueType.STORY: return 'bg-green-50 text-green-700 border-green-100';
            case IssueType.TASK: return 'bg-blue-50 text-blue-700 border-blue-100';
            case IssueType.BUG: return 'bg-red-50 text-red-700 border-red-100';
            case IssueType.EPIC: return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getPriorityStyles = (priority: IssuePriority) => {
        switch (priority) {
            case IssuePriority.HIGH: return 'text-red-500';
            case IssuePriority.MEDIUM: return 'text-orange-500';
            case IssuePriority.LOW: return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    const getInitials = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
        if (user.username) return user.username.substring(0, 2).toUpperCase();
        return 'U';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                bg-white p-4 rounded-xl border border-gray-200 transition-shadow group cursor-grab active:cursor-grabbing
                ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500/20 rotate-2 z-50 opacity-90' : 'shadow-sm hover:shadow-md'}
            `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeStyles(type)}`}>
                    {type.toUpperCase()}
                </span>
                <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-4 line-clamp-2">
                {title}
            </h4>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${getPriorityStyles(priority)}`}>
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                        </svg>
                        {priority}
                    </div>
                    {subtasks > 0 && (
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">0/{subtasks}</span>
                        </div>
                    )}
                </div>

                {assignee && (
                    <div className="flex items-center">
                        {assignee.avatarUrl ? (
                            <img src={assignee.avatarUrl} alt={assignee.firstName} className="w-6 h-6 rounded-full border border-white shadow-sm" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                                {getInitials(assignee)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssueCard;
