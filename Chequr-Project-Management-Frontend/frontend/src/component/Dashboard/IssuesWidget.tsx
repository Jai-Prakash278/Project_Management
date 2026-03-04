import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface IssuesWidgetProps {
    issues?: any[];
}

const IssuesWidget: React.FC<IssuesWidgetProps> = ({ issues = [] }) => {
    const navigate = useNavigate();
    const allOpenIssues = issues
        .filter(issue => !issue.stage?.isFinal)
        .slice(0, 5);

    const getStatusStyle = (stageName: string, stage?: any) => {
        const s = stageName.toUpperCase();
        if (s.includes('TODO') || s.includes('BACKLOG')) return 'bg-gray-100 text-gray-600';
        if (s.includes('PROGRESS')) return 'bg-orange-50 text-orange-600';
        if (s.includes('REVIEW')) return 'bg-purple-50 text-purple-600';
        if (stage?.isFinal || s.includes('DONE') || s.includes('COMPLETE')) return 'bg-green-50 text-green-600';
        return 'bg-blue-50 text-blue-600';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Recent Open Issues</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {allOpenIssues.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {allOpenIssues.map((issue) => (
                            <div key={issue.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group cursor-pointer border-l-2 border-transparent hover:border-indigo-500">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${getStatusStyle(issue.stage?.name || 'todo', issue.stage)} group-hover:scale-110 transition-transform`}>
                                        {issue.type === 'BUG' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{issue.title}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {issue?.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}
                                            </span>
                                            <span className="text-[10px] text-gray-300">•</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${issue.priority === 'HIGH' ? 'text-red-500' : 'text-gray-400'}`}>{issue.priority}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusStyle(issue.stage?.name || 'todo', issue.stage)}`}>
                                    {(issue.stage?.name || 'todo').replace(/_/g, ' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-gray-400 font-medium text-center">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuesWidget;
