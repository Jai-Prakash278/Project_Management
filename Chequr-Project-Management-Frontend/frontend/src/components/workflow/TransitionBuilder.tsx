import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface Stage {
    id: string;
    name: string;
}

interface Transition {
    id: string;
    fromStageId: string;
    toStageId: string;
    allowedRoles: string[];
}

interface TransitionBuilderProps {
    stages: Stage[];
    transitions: Transition[];
    onTransitionsChange: (transitions: Transition[]) => void;
}

const ROLES = ['Admin', 'Project Manager', 'Developer', 'QA'];

export const TransitionBuilder: React.FC<TransitionBuilderProps> = ({
    stages,
    transitions,
    onTransitionsChange,
}) => {
    const [newTransition, setNewTransition] = useState({
        fromStageId: '',
        toStageId: '',
        allowedRoles: [] as string[],
    });

    const handleAddTransition = () => {
        if (!newTransition.fromStageId || !newTransition.toStageId) return;
        if (newTransition.fromStageId === newTransition.toStageId) return;

        // If same from→to exists, merge the roles instead of blocking
        const existingIndex = transitions.findIndex(
            (t) =>
                t.fromStageId === newTransition.fromStageId &&
                t.toStageId === newTransition.toStageId
        );

        if (existingIndex !== -1) {
            // Merge roles
            const existing = transitions[existingIndex];
            const mergedRoles = Array.from(
                new Set([...existing.allowedRoles, ...newTransition.allowedRoles])
            );
            const updated = transitions.map((t, i) =>
                i === existingIndex ? { ...t, allowedRoles: mergedRoles } : t
            );
            onTransitionsChange(updated);
        } else {
            const transition: Transition = {
                id: `transition-${Date.now()}`,
                ...newTransition,
            };
            onTransitionsChange([...transitions, transition]);
        }

        setNewTransition({ fromStageId: '', toStageId: '', allowedRoles: [] });
    };

    const handleDeleteTransition = (id: string) => {
        onTransitionsChange(transitions.filter((t) => t.id !== id));
    };

    const toggleRole = (role: string) => {
        setNewTransition((prev) => ({
            ...prev,
            allowedRoles: prev.allowedRoles.includes(role)
                ? prev.allowedRoles.filter((r) => r !== role)
                : [...prev.allowedRoles, role],
        }));
    };

    const getStageName = (id: string) => stages.find((s) => s.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-4">
            {/* Ultra Compact New Transition Form */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-600 mb-0.5">
                    <Plus className="w-3.5 h-3.5" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">
                        New Transition
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 ml-0.5 uppercase">From</label>
                        <select
                            value={newTransition.fromStageId}
                            onChange={(e) => setNewTransition({ ...newTransition, fromStageId: e.target.value })}
                            className="w-full h-8 px-2 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500/30"
                        >
                            <option value="">Status...</option>
                            {stages.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 ml-0.5 uppercase">To</label>
                        <select
                            value={newTransition.toStageId}
                            onChange={(e) => setNewTransition({ ...newTransition, toStageId: e.target.value })}
                            className="w-full h-8 px-2 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500/30"
                        >
                            <option value="">Status...</option>
                            {stages.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5 ml-0.5">Roles</label>
                    <div className="flex flex-wrap gap-1">
                        {ROLES.map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${newTransition.allowedRoles.includes(role)
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleAddTransition}
                    disabled={!newTransition.fromStageId || !newTransition.toStageId || newTransition.fromStageId === newTransition.toStageId}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Create
                </button>
            </div>

            {/* Compact Transition List */}
            <div className="space-y-1.5">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
                    Defined Flow ({transitions.length})
                </h3>
                <div className="flex flex-col gap-1">
                    {transitions.map((t) => (
                        <div
                            key={t.id}
                            className="flex flex-col gap-1 p-1.5 bg-white border border-gray-50 rounded-lg group hover:border-indigo-100 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-[10px] font-bold text-gray-700 truncate max-w-[80px]">
                                        {getStageName(t.fromStageId)}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                                    <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[80px]">
                                        {getStageName(t.toStageId)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTransition(t.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            {/* Role badges */}
                            {t.allowedRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {t.allowedRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-bold border border-indigo-100"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {t.allowedRoles.length === 0 && (
                                <span className="text-[8px] text-amber-500 font-bold italic">
                                    ⚠ No roles — all blocked
                                </span>
                            )}
                        </div>
                    ))}
                    {transitions.length === 0 && (
                        <div className="py-4 text-center border border-dashed border-gray-100 rounded-lg">
                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic opacity-50">No transitions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
