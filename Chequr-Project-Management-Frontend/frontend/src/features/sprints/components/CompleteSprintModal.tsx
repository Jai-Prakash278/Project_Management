import React from 'react';
import Drawer from '../../../components/Drawer';

interface CompleteSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (action: 'backlog' | 'new_sprint') => void;
    sprintName: string;
    completedCount: number;
    incompleteCount: number;
}

const CompleteSprintModal: React.FC<CompleteSprintModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    sprintName,
    completedCount,
    incompleteCount
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete('backlog');
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Complete ${sprintName}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Completed Issues Stats */}
                <div className="flex gap-4">
                    <div className="shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {completedCount} issues were completed
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Nice work! These will be moved to the 'Done' column.
                        </p>
                    </div>
                </div>

                {/* Open Issues Stats */}
                <div className="flex gap-4">
                    <div className="shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {incompleteCount} open issues remain
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            These unfinished items will be moved to the Backlog.
                        </p>
                    </div>
                </div>



                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        className="rounded-lg bg-gray-50 border border-gray-200 py-2.5 px-6 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform active:scale-95"
                    >
                        Complete Sprint
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default CompleteSprintModal;
