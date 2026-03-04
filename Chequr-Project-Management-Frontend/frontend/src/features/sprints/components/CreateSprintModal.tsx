import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface CreateSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, startDate: string, endDate: string) => void;
}

const CreateSprintModal: React.FC<CreateSprintModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting Sprint:', { name, startDate, endDate });
        onCreate(name, startDate, endDate);
        setName(''); // Reset name
        setStartDate('');
        setEndDate('');
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0" />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-lg font-medium text-gray-900">
                                                    Create Sprint
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                                                        onClick={onClose}
                                                    >
                                                        <span className="sr-only">Close panel</span>
                                                        <X className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-8">
                                                <form onSubmit={handleSubmit} className="space-y-6">
                                                    <div>
                                                        <label htmlFor="sprint-name" className="block text-sm font-medium text-gray-700">
                                                            Sprint Name
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
                                                            <p className="mt-2 text-sm text-gray-500">
                                                                Enter a name for the new sprint.
                                                            </p>
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
                                                                    required
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
                                                                    required
                                                                    value={endDate}
                                                                    onChange={(e) => setEndDate(e.target.value)}
                                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
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
                                                            Create Sprint
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default CreateSprintModal;
