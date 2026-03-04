import React, { useState, useEffect } from 'react';
import { Sprint } from '../types';
import Drawer from '../../../components/Drawer';

interface EditSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (sprintId: string, data: Partial<Sprint>) => void;
    sprint: Sprint | null;
}

const EditSprintModal: React.FC<EditSprintModalProps> = ({ isOpen, onClose, onUpdate, sprint }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (sprint) {
            setName(sprint.name);
            setGoal(sprint.goal || '');
            setStartDate(sprint.startDate || '');
            setEndDate(sprint.endDate || '');
        }
    }, [sprint, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sprint) {
            onUpdate(sprint.id, {
                name,
                goal,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            onClose();
        }
    };

    if (!sprint) return null;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Sprint"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="sprint-name" className="block text-sm font-medium text-gray-700">
                        Sprint Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="sprint-name"
                            id="sprint-name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="Sprint Name"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="sprint-goal" className="block text-sm font-medium text-gray-700">
                        Sprint Goal
                    </label>
                    <div className="mt-1">
                        <textarea
                            name="sprint-goal"
                            id="sprint-goal"
                            rows={3}
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="What is the goal of this sprint?"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="start-date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="end-date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${!name.trim() ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Update
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default EditSprintModal;
