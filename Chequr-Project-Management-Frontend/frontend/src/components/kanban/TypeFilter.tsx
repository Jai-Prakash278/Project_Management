import React, { useState } from 'react';
import FilterDropdown from './FilterDropdown';
import { IssueType as IssueTypeEnum } from '../../types/issue.types';

interface TypeFilterProps {
    selectedTypes: IssueTypeEnum[];
    onApply: (selected: IssueTypeEnum[]) => void;
    onClear: () => void;
    onClose: () => void;
}

const TYPES = [
    IssueTypeEnum.STORY,
    IssueTypeEnum.TASK,
    IssueTypeEnum.BUG,
    IssueTypeEnum.EPIC,
    IssueTypeEnum.SUBTASK,
];

const TypeFilter: React.FC<TypeFilterProps> = ({
    selectedTypes,
    onApply,
    onClear,
    onClose,
}) => {
    const [tempSelected, setTempSelected] = useState<IssueTypeEnum[]>(selectedTypes);

    const toggleType = (type: IssueTypeEnum) => {
        setTempSelected((prev: IssueTypeEnum[]) =>
            prev.includes(type) ? prev.filter((t: IssueTypeEnum) => t !== type) : [...prev, type]
        );
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case IssueTypeEnum.STORY: return 'bg-green-500';
            case IssueTypeEnum.TASK: return 'bg-blue-500';
            case IssueTypeEnum.BUG: return 'bg-red-500';
            case IssueTypeEnum.EPIC: return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <FilterDropdown onClose={onClose}>
            <div className="p-4">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Issue Types</h3>
                <div className="flex flex-col gap-1">
                    {TYPES.map((type) => (
                        <div
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group
                                ${tempSelected.includes(type) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}
                            `}
                        >
                            <div className="relative flex items-center justify-center w-5 h-5 border-2 rounded border-gray-200 bg-white transition-all group-hover:border-indigo-400">
                                {tempSelected.includes(type) && (
                                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getTypeColor(type)} shadow-sm`} />
                                <span className="text-sm font-semibold">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100 gap-3">
                <button
                    onClick={onClear}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors px-2"
                >
                    Clear
                </button>
                <button
                    onClick={() => onApply(tempSelected)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
                >
                    Apply
                </button>
            </div>
        </FilterDropdown>
    );
};

export default TypeFilter;
