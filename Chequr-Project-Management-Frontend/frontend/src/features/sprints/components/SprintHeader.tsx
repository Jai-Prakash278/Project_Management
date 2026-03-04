import React from 'react';
import { Sprint, SprintStatus } from '../types';
import { Play, CheckSquare, Calendar, Pencil, Trash2 } from 'lucide-react';

interface SprintHeaderProps {
    sprint: Sprint;
    onStart: () => void;
    onComplete: () => void;
    onEdit: () => void;
    onDelete: () => void;
    startDisabled?: boolean | string;
}

const SprintHeader: React.FC<SprintHeaderProps> = ({ sprint, onStart, onComplete, onEdit, onDelete, startDisabled }) => {
    const isActive = sprint.status === SprintStatus.ACTIVE;
    const isCompleted = sprint.status === SprintStatus.COMPLETED;
    const isPlanned = sprint.status === SprintStatus.PLANNED;

    const shouldShowStartButton = isPlanned && (
        !startDisabled ||
        (typeof startDisabled === 'string' && startDisabled !== "Another sprint is already active")
    );

    return (
        <div className="flex justify-between items-center p-4 bg-gray-50/80 border-b border-gray-200 rounded-t-lg backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-gray-900">{sprint.name}</h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border ${isActive ? 'bg-green-50 text-green-700 border-green-200' :
                            isCompleted ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {isActive ? 'Active Sprint' : isCompleted ? 'Completed' : 'Planned'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{sprint.startDate && sprint.endDate ? `${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}` : 'No dates set'}</span>
                        <span>•</span>
                        <span>{sprint.issues?.length || 0} issues</span>
                        {sprint.goal && (
                            <>
                                <span>•</span>
                                <span className="italic text-gray-400">{sprint.goal}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 items-center">
                {/* Edit Button */}
                <button
                    onClick={onEdit}
                    className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
                    title="Edit Sprint"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-red-600 transition-colors focus:outline-none"
                    title="Delete Sprint"
                >
                    <Trash2 className="w-4 h-4" />
                </button>


                {shouldShowStartButton && (
                    <button
                        onClick={onStart}
                        disabled={!!startDisabled}
                        title={startDisabled ? (typeof startDisabled === 'string' ? startDisabled : "Start sprint disabled") : "Start this sprint"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${startDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:transform active:scale-95'
                            }`}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Start Sprint
                    </button>
                )}
                {isActive && (
                    <button
                        onClick={onComplete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 text-sm font-medium transition-all shadow-sm active:transform active:scale-95"
                    >
                        <CheckSquare className="w-4 h-4 text-green-600" />
                        Complete Sprint
                    </button>
                )}
            </div>
        </div>
    );
};

export default SprintHeader;
