import { useState, useEffect } from 'react'; // Added useEffect
import { X } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { SEND_INVITATION_MUTATION, UPDATE_USER_MUTATION } from '../../../graphql/auth.mutation'; // Added UPDATE_USER_MUTATION
import FloatingLabel from '../../../components/FloatingLabel';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';

interface InviteData {
  id?: string; // Added id for update
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  manager: string;
  reportingManager?: string; // Mapped from backend
  employeeId: string;
  roles: string;
  // 'role' is used by Teams.tsx (from soumo-admin), we will map 'roles' to it when calling onInvite
  role?: string;
}

interface InviteFormProps {
  onClose?: () => void;
  onInvite?: (data: InviteData) => void;
  mode?: 'invite' | 'edit'; // Added mode
  initialData?: InviteData | null; // Added initialData
}

const InviteForm = ({ onClose, onInvite, mode = 'invite', initialData }: InviteFormProps) => {
  const [formData, setFormData] = useState<InviteData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    manager: '',
    employeeId: '',
    roles: '',
  });

  // Effect to populate form data in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        id: initialData.id, // Ensure ID is captured
        email: initialData.email || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        phone: initialData.phone || '',
        manager: initialData.reportingManager || '',
        employeeId: initialData.employeeId || '',
        roles: initialData.roles || '',
      });
    }
  }, [mode, initialData]);

  const [sendInvitation, { loading: inviteLoading }] = useMutation(SEND_INVITATION_MUTATION);
  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER_MUTATION); // Update mutation

  const loading = mode === 'edit' ? updateLoading : inviteLoading; // Dynamic loading state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRolesChange = (selectedRoles: string[]) => {
    setFormData(prev => ({ ...prev, roles: selectedRoles.join(',') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'edit') {
        // Handle Update
        await updateUser({
          variables: {
            id: formData.id,
            input: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || undefined,
              employeeId: formData.employeeId || undefined,
              reportingManager: formData.manager || undefined,
              roles: formData.roles ? formData.roles.split(',') : [],
            }
          }
        });
        toast.success(`User ${formData.email} updated successfully.`, { duration: 2000 });
      } else {
        // Handle Invite
        console.log('Sending Invitation with:', {
          email: formData.email,
          role: formData.roles,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          employeeId: formData.employeeId,
        });

        await sendInvitation({
          variables: {
            input: {
              email: formData.email,
              roles: formData.roles ? formData.roles.split(',') : ['USER'],
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || undefined,      // Send undefined if empty
              employeeId: formData.employeeId || undefined, // Send undefined if empty
              reportingManager: formData.manager || undefined,
            }
          },
        });
        toast.success(`Invitation sent to ${formData.email}`, { duration: 2000 });
      }

      // Call onInvite (or renaming to onCallback would be better, but keeping for compatibility)
      if (onInvite) {
        onInvite({
          ...formData,
          role: formData.roles // Map roles to role for compatibility
        });
      }

      if (onClose) {
        onClose();
      }

    } catch (error: any) {
      console.error(mode === 'edit' ? "Error updating user:" : "Error sending invite:", error);
      // Show more specific error message to the user
      const errorMessage = error.message || (mode === 'edit' ? "Failed to update user" : "Failed to send invitation");
      toast.error(`Error: ${errorMessage}. Please check your permissions or network connection.`, { duration: 2000 });
    }
  };

  return (
    <div className="h-full w-full p-6 bg-white overflow-y-auto no-scrollbar">
      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#1a202c]">{mode === 'edit' ? 'Edit User' : 'Add Staff Member'}</h1>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-500">{mode === 'edit' ? 'Update user details and roles' : 'Create a new staff member and assign a role'}</p>
        <hr className="text-gray-400 my-[5vh]" />
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FloatingLabel
            id="email"
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={mode === 'edit'}
          />

          <div className="flex gap-2">
            <div className="w-1/2">
              <FloatingLabel
                id="firstName"
                label="First Name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-1/2">
              <FloatingLabel
                id="lastName"
                label="Last Name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-1/4">
              <input
                className="w-full px-[16px] py-[10px] h-[48px] bg-white border border-[#D1D5DB] rounded-lg text-[14px] text-[#374151] focus:outline-hidden focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
                type="text"
                placeholder="+91"
              />
            </div>
            <div className="w-3/4">
              <FloatingLabel
                id="phone"
                label="Phone (optional)"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <FloatingLabel
            id="manager"
            label="Reporting Manager"
            name="manager"
            type="text"
            value={formData.manager}
            onChange={handleChange}
          />

          <FloatingLabel
            id="employeeId"
            label="Company Employee ID"
            name="employeeId"
            type="text"
            value={formData.employeeId}
            onChange={handleChange}
          />

          <MultiSelectDropdown
            id="roles"
            label="Roles"
            options={['Admin', 'Manager', 'Developer', 'QA', 'User']}
            selected={formData.roles ? formData.roles.split(',') : []}
            onChange={handleRolesChange}
            name="roles"
          />

          <button
            disabled={loading}
            className="w-full h-[48px] bg-[#4F46E5] text-white font-semibold rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-70 flex items-center justify-center mt-4"
          >
            {loading ? (mode === 'edit' ? 'Updating...' : 'Sending...') : (mode === 'edit' ? 'Update User' : 'Add Staff Member')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default InviteForm