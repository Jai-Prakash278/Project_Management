import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Mail, Phone, Building2, Briefcase, Calendar, ShieldCheck, User } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { GET_USER_PROFILE, UPDATE_PROFILE } from '../graphql/user.query';

interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    status: string;
    // roles removed from query
    employmentType?: string;
    employmentStatus?: string;
    createdAt?: string;
}

interface UserProfileData {
    user: UserProfile;
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const UserProfileModal = ({ isOpen, onClose, userId }: UserProfileModalProps) => {
    const { data, loading, error } = useQuery<UserProfileData>(GET_USER_PROFILE, {
        variables: { id: userId },
        skip: !userId,
    });

    if (error) console.error('UserProfileModal Query Error:', JSON.stringify(error, null, 2));
    if (data) console.log('UserProfileModal Data:', data);

    const user = data?.user;

    const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
        onCompleted: () => {
            setIsEditing(false);
            // We can rely on Apollo cache update if we return the same ID, or force refetch
            // refetch(); 
        }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });

    // Initialize form data when user data loads or edit mode starts
    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            });
        }
    }, [user, isOpen]);

    const handleSave = () => {
        updateProfile({
            variables: {
                input: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                }
            }
        });
    };

    // Get roles from Redux since backend User query doesn't expose them
    const reduxUser = useSelector((state: RootState) => state.auth.user);
    const userRoles = reduxUser?.roles || [];

    if (!isOpen) return null;

    // Function to get initials from name
    const getInitials = (firstName?: string, lastName?: string, email?: string) => {
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    const initials = getInitials(user?.firstName, user?.lastName, user?.email);
    const fullName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.email?.split('@')[0] || 'User';

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
                                    <div className="flex h-full flex-col overflow-y-scroll no-scrollbar bg-white shadow-xl">
                                        {/* Header / Cover Area */}
                                        <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative shrink-0">
                                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                                <button
                                                    type="button"
                                                    className="rounded-full bg-white/50 p-2 text-gray-500 hover:text-gray-700 hover:bg-white focus:outline-none transition-colors"
                                                    onClick={onClose}
                                                >
                                                    <span className="sr-only">Close panel</span>
                                                    <X className="h-6 w-6" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Profile Content */}
                                        <div className="relative mt-4 flex-1 px-4 sm:px-6">
                                            <div className="-mt-16 flex justify-center mb-4">
                                                <div className="w-24 h-24 rounded-full border-4 border-white bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-bold shadow-md">
                                                    {user?.avatarUrl ? (
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt={fullName}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                            </div>

                                            {loading ? (
                                                <div className="flex justify-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                </div>
                                            ) : error ? (
                                                <div className="text-center text-red-500 py-4">
                                                    Failed to load user profile
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    {!isEditing ? (
                                                        <Dialog.Title
                                                            as="h3"
                                                            className="text-xl font-bold text-gray-900 leading-6 mb-1"
                                                        >
                                                            {fullName}
                                                        </Dialog.Title>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center mb-2">
                                                            <input
                                                                type="text"
                                                                value={formData.firstName}
                                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                                placeholder="First Name"
                                                                className="w-1/2 p-2 border rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={formData.lastName}
                                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                                placeholder="Last Name"
                                                                className="w-1/2 p-2 border rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex justify-center items-center gap-2 mb-4">
                                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${user?.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                        <span className="text-sm font-medium text-gray-500">{user?.status || 'Unknown Status'}</span>
                                                    </div>

                                                    {/* Info Grid */}
                                                    <div className="grid grid-cols-1 gap-3 text-left border-t border-gray-100 pt-4">

                                                        {/* Access / Role */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                                <ShieldCheck className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roles</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {userRoles.map((role: any) => {
                                                                        const roleName = typeof role === 'string' ? role : (role.role?.name || role.name || 'User');
                                                                        const roleKey = typeof role === 'string' ? role : (role.id || role.role?.id || Math.random().toString());
                                                                        return (
                                                                            <span key={roleKey} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                                                {roleName}
                                                                            </span>
                                                                        );
                                                                    }) || <span className="text-gray-900">User</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Organization */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                                <Building2 className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Organization</p>
                                                                <p className="text-gray-900 font-medium">Chequr</p>
                                                            </div>
                                                        </div>

                                                        {/* Email */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                                <Mail className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                                                                <a href={`mailto:${user?.email}`} className="text-gray-900 font-medium hover:text-indigo-600 transition-colors break-all">
                                                                    {user?.email}
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* Phone */}
                                                        {(user?.phone || isEditing) && (
                                                            <div className="flex items-start gap-4">
                                                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                                                    <Phone className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                                                                    {!isEditing ? (
                                                                        <p className="text-gray-900 font-medium">{user?.phone || 'Not provided'}</p>
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            value={formData.phone}
                                                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                                            placeholder="Phone Number"
                                                                            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none mt-1"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Employment Type */}
                                                        {user?.employmentType && (
                                                            <div className="flex items-start gap-4">
                                                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                                                    <Briefcase className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Employment</p>
                                                                    <p className="text-gray-900 font-medium">{user.employmentType}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Joined Date */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                                                                <Calendar className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Joined Date</p>
                                                                <p className="text-gray-900 font-medium">
                                                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    }) : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end gap-3 border-t border-gray-200 sticky bottom-0 z-10">
                                            {!isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        onClick={() => setIsEditing(true)}
                                                    >
                                                        Edit Profile
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        onClick={() => setIsEditing(false)}
                                                        disabled={updating}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        onClick={handleSave}
                                                        disabled={updating}
                                                    >
                                                        {updating ? 'Saving...' : 'Save Changes'}
                                                    </button>
                                                </>
                                            )}
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

export default UserProfileModal;
