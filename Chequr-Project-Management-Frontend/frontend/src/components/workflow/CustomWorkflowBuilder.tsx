import React, { useEffect, useState } from 'react';
import { Settings, GitMerge, ListOrdered, Layers, Route } from 'lucide-react';
import { StageList } from './StageList';
import { TransitionBuilder } from './TransitionBuilder';
import { TransitionMatrix } from './TransitionMatrix';

interface Stage {
    id: string;
    name: string;
    orderIndex: number;
    category?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

interface Transition {
    id: string;
    fromStageId: string;
    toStageId: string;
    allowedRoles: string[];
}

interface WorkflowData {
    name: string;
    transitionMode: 'SEQUENTIAL' | 'FLEXIBLE';
    stages: Stage[];
    transitions: Transition[];
}

interface CustomWorkflowBuilderProps {
    workflowData: WorkflowData;
    setWorkflowData: (data: WorkflowData) => void;
}

export const CustomWorkflowBuilder: React.FC<CustomWorkflowBuilderProps> = ({
    workflowData,
    setWorkflowData,
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'stages' | 'transitions'>('basic');

    // Auto-generate sequential transitions if mode is SEQUENTIAL
    useEffect(() => {
        if (workflowData.transitionMode === 'SEQUENTIAL') {
            const sequentialTransitions: Transition[] = [];
            for (let i = 0; i < workflowData.stages.length - 1; i++) {
                sequentialTransitions.push({
                    id: `seq-${i}`,
                    fromStageId: workflowData.stages[i].id,
                    toStageId: workflowData.stages[i + 1].id,
                    allowedRoles: ['Admin', 'Project Manager', 'Developer', 'QA'],
                });
            }
            if (JSON.stringify(sequentialTransitions) !== JSON.stringify(workflowData.transitions)) {
                setWorkflowData({
                    ...workflowData,
                    transitions: sequentialTransitions,
                });
            }
        }
    }, [workflowData.stages, workflowData.transitionMode, workflowData.transitions, setWorkflowData]);

    const updateStages = (stages: Stage[]) => {
        setWorkflowData({ ...workflowData, stages });
    };

    const updateTransitions = (transitions: Transition[]) => {
        setWorkflowData({ ...workflowData, transitions });
    };

    if (!workflowData || !workflowData.stages) return <div className="p-2 text-red-500 text-[11px]">Error: Workflow data missing</div>;

    const tabs = [
        { id: 'basic', label: 'Basic', icon: <Settings className="w-3.5 h-3.5" /> },
        { id: 'stages', label: 'Stages', icon: <Layers className="w-3.5 h-3.5" /> },
        { id: 'transitions', label: 'Transitions', icon: <Route className="w-3.5 h-3.5" /> },
    ] as const;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Ultra Compact Tab Navigation */}
            <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg mb-4 self-start scale-90 origin-left">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Compact Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'basic' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <section>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                Workflow Name
                            </label>
                            <input
                                type="text"
                                value={workflowData.name}
                                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                                placeholder="Workflow Name..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[12px] font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            />
                        </section>

                        <section>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Transition Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWorkflowData({ ...workflowData, transitionMode: 'SEQUENTIAL' })}
                                    className={`flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all ${workflowData.transitionMode === 'SEQUENTIAL'
                                        ? 'border-indigo-600 bg-indigo-50/50'
                                        : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                                        }`}
                                >
                                    <ListOrdered className={`w-4 h-4 ${workflowData.transitionMode === 'SEQUENTIAL' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold text-gray-900 leading-tight">Sequential</p>
                                        <p className="text-[9px] text-gray-500">Step-by-step</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setWorkflowData({ ...workflowData, transitionMode: 'FLEXIBLE' })}
                                    className={`flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all ${workflowData.transitionMode === 'FLEXIBLE'
                                        ? 'border-indigo-600 bg-indigo-50/50'
                                        : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                                        }`}
                                >
                                    <GitMerge className={`w-4 h-4 ${workflowData.transitionMode === 'FLEXIBLE' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold text-gray-900 leading-tight">Flexible</p>
                                        <p className="text-[9px] text-gray-500">Any stage</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'stages' && (
                    <div className="animate-in fade-in duration-200">
                        <StageList stages={workflowData.stages} onStagesChange={updateStages} />
                    </div>
                )}

                {activeTab === 'transitions' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {workflowData.transitionMode === 'FLEXIBLE' ? (
                            <TransitionBuilder
                                stages={workflowData.stages}
                                transitions={workflowData.transitions}
                                onTransitionsChange={updateTransitions}
                            />
                        ) : (
                            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center text-center gap-1.5">
                                <ListOrdered className="w-5 h-5 text-indigo-500/60" />
                                <h4 className="text-[11px] font-bold text-indigo-900">Sequential Mode Active</h4>
                                <p className="text-[10px] text-indigo-700 leading-tight opacity-70">
                                    Transitions are managed automatically.
                                </p>
                            </div>
                        )}

                        <div className="opacity-80 scale-[0.98] origin-top">
                            <TransitionMatrix
                                stages={workflowData.stages}
                                transitions={workflowData.transitions}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
