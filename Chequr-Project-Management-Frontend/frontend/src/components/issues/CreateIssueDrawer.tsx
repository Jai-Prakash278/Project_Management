import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IssueType, IssuePriority, User } from '../../types/issue.types';
import FloatingLabel from '../FloatingLabel';
import FloatingSelect from '../FloatingSelect';
import FloatingTextArea from '../FloatingTextArea';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS_QUERY } from '../../graphql/user.query';

interface CreateIssueDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    defaultStatus?: string;
    onSubmit?: (issue: any) => void;
    stages?: { id: string; name: string }[];
    members?: User[];
}
const FloatingUserSelect = ({
    label,
    value,
    onChange,
    users,
    error
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    users: User[];
    error?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedUser = users.find(u => u.id === value);
    const isFloating = isOpen || !!value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`
                    w-full px-[16px] py-[10px] h-[48px]
                    bg-white border rounded-lg
                    transition-all text-[14px] text-[#374151]
                    cursor-pointer flex items-center justify-between
                    hover:border-gray-400
                    ${isOpen ? 'ring-2 ring-[#4F46E5]/20 border-[#4F46E5]' : 'border-[#D1D5DB]'}
                    ${error ? 'border-red-500' : ''}
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-3 w-full overflow-hidden">
                    {selectedUser ? (
                        <>
                            {selectedUser.avatarUrl ? (
                                <img src={selectedUser.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium shrink-0">
                                    {(selectedUser.firstName?.[0] || 'U')}{(selectedUser.lastName?.[0] || '')}
                                </div>
                            )}
                            <span className="truncate">{selectedUser.firstName} {selectedUser.lastName}</span>
                        </>
                    ) : (
                        isFloating && <span className="text-gray-400">Unassigned</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                <label
                    className={`
                        absolute left-[12px] px-[4px] bg-white
                        transition-all duration-200 pointer-events-none
                        ${isFloating
                            ? '-top-[9px] text-[11px] font-medium z-10'
                            : 'top-[14px] text-[14px] font-normal text-[#9CA3AF]'
                        }
                        ${error
                            ? 'text-red-500'
                            : isOpen
                                ? 'text-[#4F46E5]'
                                : 'text-[#9CA3AF]'
                        }
                    `}
                >
                    {label}
                </label>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-500"
                        onClick={() => {
                            onChange('');
                            setIsOpen(false);
                        }}
                    >
                        Unassigned
                    </div>
                    {users.map(user => (
                        <div
                            key={user.id}
                            className={`
                                px-4 py-2 cursor-pointer flex items-center space-x-3 hover:bg-gray-50
                                ${user.id === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}
                            `}
                            onClick={() => {
                                onChange(user.id);
                                setIsOpen(false);
                            }}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                                    {(user.firstName?.[0] || 'U')}{(user.lastName?.[0] || '')}
                                </div>
                            )}
                            <span className="text-sm">{user.firstName} {user.lastName}</span>
                            {user.id === value && <Check size={14} className="ml-auto text-indigo-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CreateIssueDrawer: React.FC<CreateIssueDrawerProps> = ({ isOpen, onClose, defaultStatus, onSubmit, stages = [], members = [] }) => {
    // Local state for form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<IssueType | ''>('');
    const [status, setStatus] = useState<string>(defaultStatus || '');
    const [priority, setPriority] = useState<IssuePriority | ''>('');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [storyPoints, setStoryPoints] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState('');

    // Fallback to all users if members not provided
    const { data: userData } = useQuery<any>(GET_ALL_USERS_QUERY, {
        skip: members.length > 0
    });
    const users: User[] = members.length > 0 ? members : (userData?.users || []);


    React.useEffect(() => {
        if (isOpen) {
            setStatus(defaultStatus || '');
        }
    }, [isOpen, defaultStatus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (!type) {
            toast.error('Issue Type is required');
            return;
        }
        if (!priority) {
            toast.error('Priority is required');
            return;
        }
        if (!status) {
            toast.error('Status is required');
            return;
        }

        const newIssue = {
            title,
            description,
            stageId: status || null,
            priority,
            assigneeId: assigneeId || null,
            type,
            storyPoints: storyPoints ? Number(storyPoints) : null,
            dueDate: dueDate || null,
        };
        console.log('Creating Issue:', newIssue);
        if (onSubmit) {
            onSubmit(newIssue);
        }
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setType('');
        setPriority('');
        setAssigneeId('');
        setStoryPoints('');
        setDueDate('');
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out translate-x-0">
                <div className="px-6 py-6 bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-[#1a202c]">Create Issue</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-500"
                        >
                            <span className="sr-only">Close panel</span>
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-gray-500 mt-1">Create a new issue with details and assignment</p>
                </div>

                <hr className="text-gray-400 mx-6 mb-6" />

                <div className="relative flex-1 px-6 pb-6">
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {/* Row 1: Issue Type & Priority */}
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <FloatingSelect
                                    id="type"
                                    label="Issue Type"
                                    value={type}
                                    onChange={(e: any) => setType(e.target.value as IssueType)}
                                >
                                    <option value="" disabled hidden>Select Issue Type</option>
                                    {Object.values(IssueType).filter(t => t).map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </FloatingSelect>
                            </div>

                            <div className="w-1/2">
                                <FloatingSelect
                                    id="priority"
                                    label="Priority"
                                    value={priority}
                                    onChange={(e: any) => setPriority(e.target.value as IssuePriority)}
                                >
                                    <option value="" disabled hidden>Select Priority</option>
                                    {Object.values(IssuePriority).filter(p => p).map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </FloatingSelect>
                            </div>
                        </div>

                        {/* Row 2: Title */}
                        <div>
                            <FloatingLabel
                                id="title"
                                label="Title *"
                                value={title}
                                onChange={(e: any) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Row 3: Description */}
                        <div>
                            <FloatingTextArea
                                id="description"
                                label="Description"
                                rows={4}
                                value={description}
                                onChange={(e: any) => setDescription(e.target.value)}
                                showToolbar={true}
                                richText={true}
                            />
                        </div>

                        {/* Row 4: Assignee & Story Points */}
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <FloatingUserSelect
                                    label="Assignee"
                                    value={assigneeId}
                                    onChange={(val) => setAssigneeId(val)}
                                    users={users}
                                />
                            </div>

                            <div className="w-1/2">
                                <FloatingLabel
                                    id="storyPoints"
                                    label="Story Points"
                                    type="number"
                                    min="0"
                                    value={storyPoints}
                                    onChange={(e: any) => setStoryPoints(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>
                        </div>

                        {/* Row 5: Due Date */}
                        <div>
                            <FloatingLabel
                                id="dueDate"
                                label="Due Date"
                                type="date"
                                value={dueDate}
                                onChange={(e: any) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <FloatingSelect
                                id="status"
                                label="Status"
                                value={status}
                                onChange={(e: any) => setStatus(e.target.value)}
                            >
                                <option value="" disabled hidden>Select Status</option>
                                {(stages || []).filter((s: any) => s && s.id && s.name).map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </FloatingSelect>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-[48px] bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-colors flex items-center justify-center mt-4"
                        >
                            Create Issue
                        </button>
                    </form >
                </div >
            </div >
        </div >
    );
};

export default CreateIssueDrawer;
