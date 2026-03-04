import React from 'react';
import { Trash2 } from 'lucide-react';

export interface Member {
    id: string;
    name: string;
    designation: string;
    email: string;

    status: string;
    statusColor?: string;
    bgColor: string;
    isCurrentUser?: boolean; // New field
    userId?: string; // Real User ID for actions
}

interface TeamsTableProps {
    members: Member[];
    onDelete: (email: string) => void;
    onEdit: (id: string) => void; // New prop
    isAdmin: boolean;
}

const TeamsTable: React.FC<TeamsTableProps> = ({ members, onDelete, onEdit, isAdmin }) => {
    return (
        <div className="w-full overflow-x-auto bg-white">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-[#F8FAFC] border-b border-gray-200">
                        <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {members.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base
                                        ${m.status === 'Synced' ? 'bg-emerald-100 text-emerald-700' : m.status === 'Invited' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-600'}`}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{m.name}</div>
                                        <div className="text-xs text-gray-400">{m.designation}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{m.email}</td>
                            <td className={`p-4 text-sm font-bold ${m.statusColor || 'text-[#0EA5E9]'}`}>
                                {m.status}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* Edit Button - Replaces Invite */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onEdit(m.userId || m.id)}
                                            className="flex items-center gap-1.5 text-[#4F46E5] text-sm font-bold border border-[#4F46E5]/20 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}

                                    {isAdmin && (
                                        <button
                                            onClick={() => onDelete(m.email)}
                                            className="p-2 text-red-500 border border-red-100 rounded-md hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamsTable;