import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS_QUERY } from '../../graphql/user.query';
import FilterDropdown from './FilterDropdown';

interface Assignee {
    id: string;
    name: string;
    avatar?: string;
}

interface AssigneeFilterProps {
    selectedAssigneeIds: string[];
    onSelect: (assigneeIds: string[]) => void;
    onClear: () => void;
    onClose: () => void;
}

const AssigneeFilter: React.FC<AssigneeFilterProps> = ({
    selectedAssigneeIds,
    onSelect,
    onClear,
    onClose,
}) => {
    const { data, loading } = useQuery<{ users: any[] }>(GET_ALL_USERS_QUERY);

    const assignees: Assignee[] = useMemo(() => {
        const list: Assignee[] = [
            { id: 'unassigned', name: 'Unassigned' }
        ];
        if (data?.users) {
            data.users.forEach(u => {
                list.push({
                    id: u.id,
                    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    avatar: u.avatarUrl
                });
            });
        }
        return list;
    }, [data]);

    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelected, setTempSelected] = useState<string[]>(selectedAssigneeIds);

    const handleAssigneeClick = (id: string) => {
        setTempSelected(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const filteredAssignees = useMemo(() => {
        return assignees.filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assignees, searchQuery]);

    return (
        <FilterDropdown onClose={onClose}>
            <div className="p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assignee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar -mx-1 px-1">
                        {filteredAssignees.map((assignee) => {
                            const isSelected = tempSelected.includes(assignee.id);
                            return (
                                <div
                                    key={assignee.id}
                                    onClick={() => handleAssigneeClick(assignee.id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all mb-1 group
                                    ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}
                                `}
                                >
                                    <div className="relative flex items-center justify-center w-5 h-5 border-2 rounded border-gray-200 bg-white transition-all group-hover:border-indigo-400">
                                        {isSelected && (
                                            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {assignee.id !== 'unassigned' ? (
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm overflow-hidden">
                                                {assignee.avatar ? (
                                                    <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-white">
                                                <X className="w-3 h-3" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium">{assignee.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAssignees.length === 0 && (
                            <div className="py-8 text-center text-sm text-gray-400 font-medium">
                                No users found
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100 gap-3">
                <button
                    onClick={onClear}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors px-2"
                >
                    Clear
                </button>
                <button
                    onClick={() => onSelect(tempSelected)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
                >
                    Apply
                </button>
            </div>
        </FilterDropdown>
    );
};

export default AssigneeFilter;
