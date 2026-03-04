import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Mail, Plus } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { confirmToast } from '../utils/toast.utils';
import TeamsTable, { Member } from '../component/TeamsTable';
import InviteForm from '../component/layout/Sidebar/InviteForm';
import EditUserModal from '../component/EditUserModal';
import { DELETE_USER_MUTATION } from '../graphql/auth.mutation';
import { GET_MY_PROFILE_QUERY, GET_USER_DETAILS_QUERY, GET_ORGANIZATION_TEAM_QUERY, GET_ALL_USERS_QUERY } from '../graphql/auth.query';

export default function Teams() {
    const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null); // State for modal
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);

    // 1. Get current user ID
    const { data: meData } = useQuery<{ me: { id: string; roles: string[] } }>(GET_MY_PROFILE_QUERY);
    const userId = meData?.me?.id;

    // 2. Get User's Organization ID
    const { data: userData } = useQuery<{ user: { organizationId: string } }>(GET_USER_DETAILS_QUERY, {
        variables: { id: userId },
        skip: !userId,
        fetchPolicy: 'network-only',
    });
    const orgId = userData?.user?.organizationId;

    // 3. Get Organization Team (Primary)
    const { data: teamData, loading: teamLoading, error: teamError, refetch: refetchTeam } = useQuery<{ organizationTeam: any[] }>(GET_ORGANIZATION_TEAM_QUERY, {
        variables: { orgId },
        skip: !orgId,
        fetchPolicy: 'network-only',
    });

    // 3b. Get All Users (Fallback if no Org)
    const { data: allUsersData, loading: allUsersLoading, error: allUsersError, refetch: refetchAll } = useQuery<{ users: any[] }>(GET_ALL_USERS_QUERY, {
        skip: !!orgId, // Skip if we have an orgId
        fetchPolicy: 'network-only',
    });

    const loading = teamLoading || (allUsersLoading && !orgId);
    const error = teamError || (allUsersError && !orgId ? allUsersError : undefined);

    // Unified refetch
    const refetch = () => {
        if (orgId) refetchTeam();
        else refetchAll();
    };

    useEffect(() => {
        if (teamData?.organizationTeam) {
            const mappedMembers: Member[] = teamData.organizationTeam.map((member: any) => ({
                id: member.id, // Use real ID now
                userId: member.id,
                name: (member.name && member.name.trim()) ? member.name : member.email,
                designation: member.roles && member.roles.length > 0 ? member.roles.join(', ') : 'Teammate',
                email: member.email,
                status: member.status === 'ACTIVE' ? 'Synced' : (member.status === 'INVITED' ? 'Invited' : 'Inactive'),
                bgColor: member.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : (member.status === 'INVITED' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'),
                statusColor: member.status === 'ACTIVE' ? 'text-green-600' : (member.status === 'INVITED' ? 'text-blue-600' : 'text-red-600'),
                isCurrentUser: member.id === userId // Check if it's me
            }));
            setMembers(mappedMembers);
        } else if (allUsersData?.users) {
            const mappedMembers: Member[] = allUsersData.users.map((user: any) => ({
                id: user.id,
                userId: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                designation: user.roleKeys && user.roleKeys.length > 0 ? user.roleKeys.join(', ') : 'Teammate',
                email: user.email,
                status: user.status === 'ACTIVE' ? 'Synced' : (user.status === 'INVITED' ? 'Invited' : 'Inactive'), // Simplify status mapping
                bgColor: user.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700',
                statusColor: user.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600',
                isCurrentUser: user.id === userId
            }));
            setMembers(mappedMembers);
        }
    }, [teamData, allUsersData, userId]);

    const filteredMembers = useMemo(() => {
        let result = members;

        // Apply status filter
        if (filterStatus !== 'All') {
            result = result.filter(m => m.status === filterStatus);
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(member =>
                member.name.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query) ||
                member.designation.toLowerCase().includes(query)
            );
        }

        return result;
    }, [members, searchQuery, filterStatus]);

    // 4. Delete User Mutation
    const [deleteUser] = useMutation(DELETE_USER_MUTATION);

    const handleDelete = async (email: string) => {
        const confirmed = await confirmToast(
            'Delete Member?',
            `Are you sure you want to remove ${email}?`,
            'delete'
        );
        if (confirmed) {
            try {
                const loadingToast = toast.loading("Deleting user...");
                await deleteUser({ variables: { email } });
                setMembers(prev => prev.filter(member => member.email !== email));
                toast.success("User deleted successfully", { id: loadingToast });
            } catch (err: any) {
                console.error("Delete failed:", err);
                toast.error("Failed to delete user: " + err.message);
            }
        }
    };

    const handleInviteSuccess = () => {
        refetch(); // Reload the list from the server
        setIsInviteFormOpen(false);
    };

    if (loading) return <div className="p-8">Loading teams...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading teams: {error.message}</div>;

    const isAdmin = meData?.me?.roles?.includes('ADMIN') || false;

    return (
        <div className="flex flex-col h-full relative">
            {/* Page Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Total Synced:</span>
                        <span className="font-semibold text-gray-900">{members.filter(m => m.status === 'Synced').length}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <button
                    onClick={() => setIsInviteFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Teammates
                </button>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search teammates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border ${isFilterOpen ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-gray-300'} rounded-lg hover:bg-gray-50 transition-colors`}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 4h12M2 8h8M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            {filterStatus === 'All' ? 'Filters' : filterStatus}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                                    {['All', 'Synced', 'Invited', 'Inactive'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterStatus === status ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setIsInviteFormOpen(!isInviteFormOpen)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                        <Mail className="w-4 h-4" />
                        Invite
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8">
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <TeamsTable
                        members={filteredMembers}
                        onDelete={handleDelete}
                        isAdmin={isAdmin}
                        onEdit={(id) => setEditingUserId(id)}
                    />
                </div>
            </div>

            {/* Edit User Drawer - Using InviteForm in 'edit' mode */}
            {editingUserId && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/10 transition-opacity"
                        onClick={() => setEditingUserId(null)}
                    />

                    {/* Sidebar */}
                    <div className="relative w-1.6/3 h-full bg-white shadow-2xl overflow-y-auto">
                        <InviteForm
                            onClose={() => setEditingUserId(null)}
                            onInvite={() => {
                                refetch();
                                setEditingUserId(null); // Close drawer on success
                            }}
                            mode="edit"
                            initialData={(() => {
                                const user = teamData?.organizationTeam?.find((m: any) => m.id === editingUserId);
                                return user ? { ...user, roles: user.roles.join(',') } : null;
                            })()} // Cast safely or map
                        />
                    </div>
                </div>
            )}

            {/* Invite Form Overlay */}
            {isInviteFormOpen && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/10 transition-opacity"
                        onClick={() => setIsInviteFormOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="relative w-1.6/3 h-full bg-white shadow-2xl overflow-y-auto">
                        <InviteForm
                            onClose={() => setIsInviteFormOpen(false)}
                            onInvite={handleInviteSuccess} // Refetch on success
                        />
                    </div>
                </div>
            )}
        </div>
    );
};