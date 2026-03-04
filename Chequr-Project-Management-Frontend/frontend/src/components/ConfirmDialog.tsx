import React from 'react';
import { AlertTriangle, Archive, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type: 'delete' | 'archive' | 'default';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type
}) => {
    if (!isOpen) return null;

    const isDelete = type === 'delete';
    const Icon = isDelete ? AlertTriangle : Archive;
    const confirmBtnColor = isDelete
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

    const iconBgColor = isDelete ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={onClose}
            />

            <div className="relative overflow-hidden text-left transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:w-full sm:max-w-lg">
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className={`flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-full sm:mx-0 sm:h-10 sm:w-10 ${iconBgColor}`}>
                            <Icon className="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 py-3 bg-gray-50 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                        type="button"
                        className={`inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmBtnColor}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {isDelete ? 'Delete' : 'Archive'}
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
