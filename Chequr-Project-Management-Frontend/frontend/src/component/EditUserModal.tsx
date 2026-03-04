import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { UPDATE_USER_MUTATION } from '../graphql/auth.mutation';
import { GET_USER_DETAILS_QUERY } from '../graphql/auth.query';
import FloatingLabel from '../components/FloatingLabel';
import { X } from 'lucide-react';

interface EditUserModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface UserData {
    user: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    }
}

export default function EditUserModal({ userId, onClose, onSuccess }: EditUserModalProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '' // Read-only
    });
    const [error, setError] = useState<string | null>(null);

    // Fetch user details
    const { data, loading: queryLoading } = useQuery<UserData>(GET_USER_DETAILS_QUERY, {
        variables: { id: userId },
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (data?.user) {
            setFormData({
                firstName: data.user.firstName || '',
                lastName: data.user.lastName || '',
                phone: data.user.phone || '',
                email: data.user.email || ''
            });
        }
    }, [data]);

    const [updateUser, { loading: mutationLoading }] = useMutation(UPDATE_USER_MUTATION);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await updateUser({
                variables: {
                    id: userId,
                    input: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone
                    }
                }
            });
            toast.success('User profile updated successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err.message || 'Failed to update user';
            setError(msg);
            toast.error(msg);
        }
    };

    if (!userId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Edit User Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {queryLoading ? (
                        <div className="text-center py-4 text-gray-500">Loading user details...</div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FloatingLabel
                                id="email"
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                disabled={true}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FloatingLabel
                                    id="firstName"
                                    label="First Name"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                                <FloatingLabel
                                    id="lastName"
                                    label="Last Name"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>

                            <FloatingLabel
                                id="phone"
                                label="Phone Number"
                                type="tel"
                                value={formData.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                            />

                            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutationLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    {mutationLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
