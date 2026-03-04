import React from 'react';
import { ClipboardList, Activity, CheckCircle2, Clock } from 'lucide-react';

interface SummaryCardsProps {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ open, inProgress, completed, overdue }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                    <ClipboardList size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">{open}</h3>
                    <p className="text-sm text-gray-500 font-medium">Open Issues</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <Activity size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">{inProgress}</h3>
                    <p className="text-sm text-gray-500 font-medium">In Progress</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">{completed}</h3>
                    <p className="text-sm text-gray-500 font-medium">Completed</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-full">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800">{overdue}</h3>
                    <p className="text-sm text-gray-500 font-medium">Overdue</p>
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
