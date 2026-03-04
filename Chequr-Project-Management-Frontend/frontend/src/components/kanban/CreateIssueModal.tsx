import React, { useState } from 'react';
import { X, Loader2, ChevronDown, Check, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import FloatingLabel from '../FloatingLabel';

interface CreateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (issueData: any) => void;
    columnId: string;
}

const MOCK_ASSIGNEES = [
    { name: 'Alice Smith', avatar: undefined },
    { name: 'Bob Jones', avatar: undefined },
    { name: 'Charlie Dave', avatar: undefined },
    { name: 'Antigravity AI', avatar: undefined },
];

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onSubmit, columnId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'STORY' as const, // Default to enum value
        priority: 'MEDIUM' as const, // Default to enum value
        assignee: MOCK_ASSIGNEES[0],
        sprint: 'Sprint 1',
        storyPoints: '' as number | '',
        dueDate: '',
    });
    const [errors, setErrors] = useState<{ title?: string }>({});

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { title?: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newIssue = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                storyPoints: formData.storyPoints ? Number(formData.storyPoints) : undefined,
                subtasks: 0,
            };

            onSubmit(newIssue);
            toast.success('Issue created successfully');
            setFormData({
                title: '',
                description: '',
                type: 'STORY',
                priority: 'MEDIUM',
                assignee: MOCK_ASSIGNEES[0],
                sprint: 'Sprint 1',
                storyPoints: '',
                dueDate: '',
            });
            onClose();
        } catch (error) {
            toast.error('Failed to create issue');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssigneeChange = (name: string) => {
        const assignee = MOCK_ASSIGNEES.find(a => a.name === name) || MOCK_ASSIGNEES[0];
        setFormData(prev => ({ ...prev, assignee }));
    };

    return (
        <div className="absolute inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/10 transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out translate-x-0">
                <div className="p-8 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-2xl font-semibold text-[#1a202c]">Create Issue</h1>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">Create a new issue in <span className="font-semibold text-gray-700 capitalize">"{columnId.replace(/([A-Z])/g, ' $1').trim()}"</span></p>

                    <hr className="border-gray-100 mb-8" />

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <FloatingLabel
                                    id="title"
                                    name="title"
                                    label="Title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    error={errors.title}
                                    placeholder="Brief summary of the work"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 ml-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all resize-none"
                                    placeholder="Add more details about this issue..."
                                />
                            </div>

                            {/* Type and Priority */}
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5" />
                                        Type
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full h-[48px] px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer"
                                        >
                                            <option value="STORY">Story</option>
                                            <option value="TASK">Task</option>
                                            <option value="BUG">Bug</option>
                                            <option value="EPIC">Epic</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Priority
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className="w-full h-[48px] px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Assignee and Sprint */}
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Assignee
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="assignee"
                                            value={formData.assignee.name}
                                            onChange={(e) => handleAssigneeChange(e.target.value)}
                                            className="w-full h-[48px] px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer"
                                        >
                                            {MOCK_ASSIGNEES.map(a => (
                                                <option key={a.name} value={a.name}>{a.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Sprint
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="sprint"
                                            value={formData.sprint}
                                            onChange={handleChange}
                                            className="w-full h-[48px] px-4 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#374151] appearance-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] cursor-pointer"
                                        >
                                            <option value="Sprint 1">Sprint 1</option>
                                            <option value="Sprint 2">Sprint 2</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Story Points and Due Date */}
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <FloatingLabel
                                        id="storyPoints"
                                        name="storyPoints"
                                        label="Story Points"
                                        type="number"
                                        min="0"
                                        value={formData.storyPoints}
                                        onChange={handleChange}
                                        placeholder="e.g. 3"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <FloatingLabel
                                        id="dueDate"
                                        name="dueDate"
                                        label="Due Date"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="mt-auto pt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-[48px] bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Creating Issue...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>Create Issue</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full h-[40px] mt-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateIssueModal;
