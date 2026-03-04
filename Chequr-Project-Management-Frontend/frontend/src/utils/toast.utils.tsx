import toast from 'react-hot-toast';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmToastProps {
    title: string;
    message: string;
    type?: 'delete' | 'confirm' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    id: string;
}

const ConfirmToastContent = ({ title, message, type = 'confirm', onConfirm, onCancel, id }: ConfirmToastProps) => {
    const isDelete = type === 'delete';

    return (
        <div className="max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${isDelete ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isDelete ? <AlertTriangle size={20} /> : <Info size={20} />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-t border-gray-100 bg-gray-50/50 p-3 justify-end gap-3">
                <button
                    onClick={() => {
                        onCancel();
                        toast.dismiss(id);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        toast.dismiss(id);
                    }}
                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-sm ${isDelete
                            ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                        }`}
                >
                    {isDelete ? 'Delete' : 'Confirm'}
                </button>
            </div>
        </div>
    );
};

/**
 * A reusable confirmation dialog using react-hot-toast.
 * Returns a promise that resolves to true if confirmed, false otherwise.
 */
export const confirmToast = (title: string, message: string, type: 'delete' | 'confirm' | 'info' = 'confirm'): Promise<boolean> => {
    return new Promise((resolve) => {
        toast.custom(
            (t) => (
                <ConfirmToastContent
                    id={t.id}
                    title={title}
                    message={message}
                    type={type}
                    onConfirm={() => resolve(true)}
                    onCancel={() => resolve(false)}
                />
            ),
            { duration: Infinity, position: 'top-center' }
        );
    });
};
