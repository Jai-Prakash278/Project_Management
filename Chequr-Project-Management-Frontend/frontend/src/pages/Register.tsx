import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQuery } from '@apollo/client/react';
import { COMPLETE_REGISTRATION_MUTATION } from '../graphql/auth.mutation';
import { GET_INVITE_DATA_QUERY } from '../graphql/auth.query';
import { useAuth } from '../components/Auth';
import LoginCarousel from '../components/LoginCarousel';
import LogoHeader from '../components/LogoHeader';
import FloatingLabel from '../components/FloatingLabel';

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Query to fetch pre-filled data
  const { loading: queryLoading, error: queryError, data: inviteData } = useQuery<{ getInviteData: any }>(GET_INVITE_DATA_QUERY, {
    variables: { token },
    skip: !token
  });

  // Mutation
  const [completeRegistration, { loading: mutationLoading }] = useMutation(COMPLETE_REGISTRATION_MUTATION);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Token is missing.');
    }
  }, [token]);

  useEffect(() => {
    if (inviteData && inviteData.getInviteData) {
      const { email, firstName, lastName } = inviteData.getInviteData;
      setEmail(email || '');
      setFirstName(firstName || '');
      setLastName(lastName || '');
    }
  }, [inviteData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Invalid or expired invitation link.");
    }
  }, [queryError]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError("Invalid invitation token.");
      return;
    }

    setLoading(true);

    try {
      await completeRegistration({
        variables: {
          input: {
            token,
            password,
            firstName,
            lastName
          }
        }
      });


      toast.success("Registration successful! Please log in.");
      navigate('/login');

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F9F9F9] p-[8px] font-sans text-gray-900 overflow-hidden relative gap-[9px]">
      <LoginCarousel />

      <div className="w-[850px] h-full max-h-full bg-white border border-[#E8EAEE] rounded-xl flex flex-col p-6 shadow-sm overflow-hidden flex-none">
        <LogoHeader />

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-[196px] overflow-y-auto custom-scrollbar">
          {queryLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading invitation details...</div>
            </div>
          ) : (
            <div className="w-full max-w-[410px] mx-auto flex flex-col items-center py-4">

              <div className="w-full flex flex-col gap-6">
                <h1 className="text-[32px] font-extrabold text-[#374151] mb-2 text-center leading-[40px]">Complete Registration</h1>
                <p className="text-gray-500 mb-6 text-center">Set up your password to join <span className="font-semibold text-indigo-600">Chequr</span>.</p>

                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Read-Only Fields - Compact Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingLabel
                      id="firstName"
                      label="First Name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <FloatingLabel
                      id="lastName"
                      label="Last Name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <FloatingLabel
                    id="email"
                    label="Work Email Address"
                    type="email"
                    value={email}
                    disabled={true}
                  />

                  {/* Password Fields */}
                  <FloatingLabel
                    id="password"
                    label="Set Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  <FloatingLabel
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />

                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-[36px] bg-[#4F46E5] border border-[#4338CA] text-white font-semibold rounded-lg shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.35)] hover:bg-[#4338CA] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-[13px] text-gray-500 hover:text-gray-700"
                    >
                      Already have an account? Log in
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      </div >
    </div >
  );
};