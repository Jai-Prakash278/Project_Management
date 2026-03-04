import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import FloatingLabel from './FloatingLabel';
import FloatingTextArea from './FloatingTextArea';
import MultiSelectUser from './MultiSelectUser';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_USERS_QUERY } from '../graphql/user.query';

import { Project, User } from '../types/project.types';

interface EditProjectDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (updatedProject: Project) => void;
}

const EditProjectDrawer: React.FC<EditProjectDrawerProps> = ({ isOpen, onClose, project, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        members: [] as string[],
        color: 'indigo' // Default
    });

    const COLORS = [
        { id: 'indigo', bg: 'bg-indigo-500' },
        { id: 'purple', bg: 'bg-purple-500' },
        { id: 'green', bg: 'bg-green-500' },
        { id: 'orange', bg: 'bg-orange-500' },
    ];

    // Get all users for the member select
    const { data: allUsersData } = useQuery(GET_ALL_USERS_QUERY);
    const allUsers = (allUsersData as any)?.users
        ?.filter((u: any) => u.status === 'ACTIVE')
        ?.map((u: any) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            avatar: u.avatarUrl
        })) || [];

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.title || '',
                description: project.description || '',
                members: project.members ? project.members.map((m: User) => m.id) : [],
                color: project.color || 'indigo'
            });
        }
    }, [project]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updatedProject: Project = {
            ...project,
            title: formData.name,
            description: formData.description,
            color: formData.color,
            // We need to keep the member objects in the local state for UI consistency until refetch.
            // But we only have IDs here.
            // Ideally we should assume the backend handles the member update via a specific input.
            // For now, let's just pass what we have, but we need to match the type.
            // We can't easily reconstruct the member objects here without searching allUsers again.
            members: project.members // Keep existing member objects reference
        };

        onUpdate({
            ...updatedProject,
            members: allUsers.filter((u: any) => formData.members.includes(u.id)).map((u: any) => ({
                id: u.id,
                firstName: u.name.split(' ')[0],
                lastName: u.name.split(' ').slice(1).join(' '),
                avatarUrl: u.avatar,
                email: u.email
            }))
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
                <div className="flex bg-white z-10 sticky top-0 justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleSubmit}>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                        <div className="space-y-5">
                            <FloatingLabel
                                id="projectName"
                                label="Project Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />

                            <FloatingTextArea
                                id="description"
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Color Picker matching Projects.tsx */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="flex gap-3">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
                                        className={`
                                            w-8 h-8 rounded-full ${color.bg} transition-all
                                            ${formData.color === color.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}
                                        `}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <MultiSelectUser
                                label="Manage Members"
                                selectedIds={formData.members}
                                onChange={(selectedIds) => setFormData(prev => ({ ...prev, members: selectedIds }))}
                                users={allUsers}
                                variant="list"
                            />
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 pb-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 shadow-indigo-100"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProjectDrawer;
