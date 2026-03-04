import React from 'react';
import { Check } from 'lucide-react';

interface Stage {
    id: string;
    name: string;
}

interface Transition {
    fromStageId: string;
    toStageId: string;
}

interface TransitionMatrixProps {
    stages: Stage[];
    transitions: Transition[];
}

export const TransitionMatrix: React.FC<TransitionMatrixProps> = ({ stages, transitions }) => {
    const hasTransition = (fromId: string, toId: string) => {
        return transitions.some((t) => t.fromStageId === fromId && t.toStageId === toId);
    };

    // Filter out stages with empty names for the preview
    const activeStages = stages.filter((s) => s && s.name && s.name.trim() !== '');

    if (activeStages.length === 0) {
        return (
            <div className="text-sm text-gray-400 italic text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Add stages to see transition matrix
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Transition Matrix Preview
            </h3>
            <div className="bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-[9px] text-left border-collapse bg-white table-fixed">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-1.5 border-r border-gray-100 bg-gray-50/80 font-bold text-gray-600 w-16 truncate uppercase tracking-tighter">
                                    FROM \ TO
                                </th>
                                {stages.map((stage) => (
                                    <th key={stage.id} className="p-1.5 border-r border-gray-100 font-bold text-gray-500 text-center truncate">
                                        {stage.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stages.map((fromStage) => (
                                <tr key={fromStage.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <td className="p-1.5 border-r border-gray-100 bg-gray-50/50 font-bold text-gray-600 truncate">
                                        {fromStage.name}
                                    </td>
                                    {stages.map((toStage) => {
                                        const isTransitionAllowed = transitions.some(
                                            (t) => t.fromStageId === fromStage.id && t.toStageId === toStage.id
                                        );
                                        return (
                                            <td
                                                key={`${fromStage.id}-${toStage.id}`}
                                                className={`p-1 border-r border-gray-100 text-center ${isTransitionAllowed ? 'bg-indigo-50/20' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-center h-4 items-center">
                                                    {isTransitionAllowed && (
                                                        <div className="w-3.5 h-3.5 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-2 bg-indigo-50/30 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-md shadow-sm" />
                    <span className="text-[9px] font-bold text-indigo-900/60 uppercase tracking-widest">Allowed Transition Path</span>
                </div>
            </div>
            <div className="flex items-start gap-1.5 px-1">
                <span className="text-amber-500 text-[12px] leading-none mt-0.5">*</span>
                <p className="text-[10px] text-gray-400 leading-normal">
                    Matrix shows allowed status changes. Admin roles can perform any transition if not strictly defined.
                </p>
            </div>
        </div>
    );
};
