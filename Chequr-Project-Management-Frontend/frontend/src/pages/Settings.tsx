import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_MY_PROFILE_QUERY, GET_USER_DETAILS_QUERY } from '../graphql/auth.query';
import { UPDATE_PROFILE_MUTATION } from '../graphql/auth.mutation';
import FloatingLabel from '../components/FloatingLabel';

const Settings = () => {
    // 1. Get Me (ID)
    const { data: meData, loading: meLoading, error: meError } = useQuery<{ me: { id: string } }>(GET_MY_PROFILE_QUERY);
    const userId = meData?.me?.id;

    // 2. Get User Details
    const { data: userData, loading: userLoading, error: userError } = useQuery<{ user: any }>(GET_USER_DETAILS_QUERY, {
        variables: { id: userId },
        skip: !userId,
        fetchPolicy: 'network-only',
    });

    const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE_MUTATION);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (userData?.user) {
            setFormData({
                firstName: userData.user.firstName || '',
                lastName: userData.user.lastName || '',
                phone: userData.user.phone || '',
            });
        }
    }, [userData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        try {
            await updateProfile({
                variables: {
                    input: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                    },
                },
            });
            setMsg({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Failed to update profile' });
        }
    };

    if (meLoading || userLoading) return <div className="p-8">Loading profile...</div>;
    if (meError || userError) return <div className="p-8 text-red-500">Error: {meError?.message || userError?.message}</div>;

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            <div className="p-8 max-w-2xl">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FloatingLabel
                            id="firstName"
                            label="First Name"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                        <FloatingLabel
                            id="lastName"
                            label="Last Name"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </div>
                    <FloatingLabel
                        id="phone"
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    {msg.text && (
                        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {msg.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={updating}
                        className="px-6 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-70"
                    >
                        {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;