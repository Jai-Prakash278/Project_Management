import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import Drawer from '../../../components/Drawer';

interface StartSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (startDate: string, endDate: string, goal: string) => void;
    sprintName: string;
    issueCount: number;
}

const StartSprintModal: React.FC<StartSprintModalProps> = ({ isOpen, onClose, onStart, sprintName, issueCount }) => {
    const [name, setName] = useState(sprintName);
    const [duration, setDuration] = useState('2weeks');
    // Using datetime-local format: YYYY-MM-DDTHH:mm
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 16);
    });
    const [goal, setGoal] = useState('');

    // Update local name if prop changes
    useEffect(() => {
        setName(sprintName);
    }, [sprintName]);

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setDuration(val);
        if (val === 'custom') return;

        const weeks = parseInt(val.charAt(0));
        if (!isNaN(weeks)) {
            const start = new Date(startDate);
            const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
            setEndDate(end.toISOString().slice(0, 16));
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setStartDate(newStart);

        if (duration !== 'custom' && newStart) {
            const weeks = parseInt(duration.charAt(0));
            if (!isNaN(weeks)) {
                const start = new Date(newStart);
                const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
                setEndDate(end.toISOString().slice(0, 16));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStart(startDate, endDate, goal);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Start ${sprintName}`}
            size="md"
        >
            <p className="text-xs text-gray-500 mb-6">
                {issueCount} issues will be included in this sprint.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Sprint Name <span className="text-blue-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Duration
                    </label>
                    <select
                        value={duration}
                        onChange={handleDurationChange}
                        className="block w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 transition-colors appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                    >
                        <option value="1week">1 week</option>
                        <option value="2weeks">2 weeks</option>
                        <option value="3weeks">3 weeks</option>
                        <option value="4weeks">4 weeks</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Start Date
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="block w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            End Date
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={duration !== 'custom'}
                            className={`block w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 transition-colors ${duration !== 'custom' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 focus:bg-white'}`}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Sprint Goal
                    </label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 transition-colors resize-none"
                        placeholder="What are we trying to achieve?"
                    />
                </div>

                <div className="mt-8 flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-8 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform active:scale-95"
                    >
                        Start
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default StartSprintModal;
