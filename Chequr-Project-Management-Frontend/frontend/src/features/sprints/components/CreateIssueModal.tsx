import { useQuery } from '@apollo/client/react';
import { AtSign, Bold, ChevronDown, HelpCircle, Image as ImageIcon, Italic, Link as LinkIcon, List } from 'lucide-react';
import React, { useState } from 'react';
import Drawer from '../../../components/Drawer';
import { GET_PROJECT_QUERY } from '../../../graphql/projects.query';
import { Issue } from '../types';

interface CreateIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (issue: any) => void;
    projectId: string;
    stages: any[];
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ isOpen, onClose, onCreate, projectId, stages }) => {
    const [type, setType] = useState('TASK');
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [reporterId, setReporterId] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [createAnother, setCreateAnother] = useState(false);

    const { data: projectData, loading: projectLoading } = useQuery<{ project: { name: string; members: any[] } }>(GET_PROJECT_QUERY, {
        variables: { id: projectId },
        skip: !projectId || !isOpen
    });

    const members = projectData?.project?.members || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!summary.trim()) return;

        onCreate({
            title: summary,
            type: type,
            priority: priority,
            description,
            stageId: stages[0]?.id,
            assigneeId: assigneeId || null,
            reporterId: reporterId || null,
            sprintId: undefined // Undefined for backlog
        });

        if (!createAnother) {
            onClose();
        }
        resetForm();
    };

    const resetForm = () => {
        setSummary('');
        setDescription('');
        setReporterId('');
        setAssigneeId('');
        setPriority('MEDIUM');
        setCreateAnother(false);
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Create issue"
            size="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            PROJECT
                        </label>
                        <div className="py-2.5 px-3 bg-gray-50 border rounded-md text-sm text-gray-700 font-medium">
                            {projectData?.project?.name || 'Loading...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            ISSUE TYPE <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="block w-full appearance-none rounded-md border-gray-300 bg-gray-50 py-2.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 border hover:bg-gray-100 transition-colors"
                            >
                                <option value="STORY">Story</option>
                                <option value="TASK">Task</option>
                                <option value="BUG">Bug</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        SUMMARY <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="block w-full rounded-md border-gray-300 bg-gray-50 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 border transition-shadow"
                        placeholder="What needs to be done?"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        DESCRIPTION
                    </label>
                    <div className="rounded-md border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <div className="bg-gray-50 px-2 py-1.5 border-b border-gray-200 flex items-center gap-1">
                            {[Bold, Italic, LinkIcon, List].map((Icon, i) => (
                                <button key={i} type="button" className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
                                    <Icon className="h-3.5 w-3.5" />
                                </button>
                            ))}
                        </div>
                        <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="block w-full border-0 py-2 px-3 text-sm focus:ring-0 bg-white placeholder-gray-400"
                            placeholder="Describe the task in detail..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            REPORTER
                        </label>
                        <div className="relative">
                            <select
                                value={reporterId}
                                onChange={(e) => setReporterId(e.target.value)}
                                className="block w-full appearance-none rounded-md border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 border hover:bg-gray-50 transition-colors"
                            >
                                <option value="">Select Reporter</option>
                                {members.map((member: any) => (
                                    <option key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            ASSIGNEE
                        </label>
                        <div className="relative">
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="block w-full appearance-none rounded-md border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 border hover:bg-gray-50 transition-colors"
                            >
                                <option value="">Unassigned</option>
                                {members.map((member: any) => (
                                    <option key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        PRIORITY
                    </label>
                    <div className="relative">
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="block w-full appearance-none rounded-md border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 border hover:bg-gray-50 transition-colors"
                        >
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center">
                        <input
                            id="create-another"
                            type="checkbox"
                            checked={createAnother}
                            onChange={(e) => setCreateAnother(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="create-another" className="ml-2 block text-sm text-gray-900">
                            Create another
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="rounded-md border-none bg-transparent py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md border border-transparent bg-blue-700 py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </form>
        </Drawer>
    );
};

export default CreateIssueModal;
