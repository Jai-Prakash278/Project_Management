import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// import { useDispatch, useSelector } from 'react-redux'; // Removed
// import { RootState } from '../redux/store'; // Removed
// import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice'; // Removed
import { useAuth } from '../components/Auth'; // New Import
import { store } from '../redux/store'; // Import store to access auth state
import LoginCarousel from '../components/LoginCarousel';
import FloatingLabel from '../components/FloatingLabel';
import LogoHeader from '../components/LogoHeader';

import { useMutation } from '@apollo/client/react';
import {
    LOGIN_MUTATION, FORGOT_PASSWORD_MUTATION,
    VERIFY_RESET_OTP_MUTATION,
    RESET_PASSWORD_MUTATION,
} from '../graphql/auth.mutation';

import { LoginResponse } from '../types/auth.types';

type AuthStep = 'LOGIN' | 'FORGOT_PASSWORD' | 'VERIFY_OTP' | 'RESET_PASSWORD';

export default function Login() {
    // Navigation & Redux
    const navigate = useNavigate();
    // const dispatch = useDispatch(); // Removed
    // const { loading: reduxLoading, error: authError } = useSelector((state: RootState) => state.auth); // Removed

    // Use the Auth Component/Hook
    const { loading: reduxLoading, error: authError, loginStart, login: loginAction, loginFailure, isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Mutation returns structured LoginResponse
    const [login, { loading: mutationLoading }] = useMutation<{ login: LoginResponse }>(LOGIN_MUTATION);
    const [forgotPasswordMutation, { loading: forgotPasswordLoading }] = useMutation(FORGOT_PASSWORD_MUTATION);
    const [verifyOtpMutation] = useMutation(VERIFY_RESET_OTP_MUTATION);
    const [resetPasswordMutation] = useMutation(RESET_PASSWORD_MUTATION);

    // Combine loading states if needed, or just use mutationLoading for the form
    const loading = reduxLoading || mutationLoading;
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Local State for Form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<AuthStep>('LOGIN');

    // Forgot Password Flow State
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [timer, setTimer] = useState(25);

    // Refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Timer Logic for OTP
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'VERIFY_OTP' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    // Handlers
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        loginStart(); // Use hook

        try {
            const res = await login({
                variables: { email, password },
            });

            if (res.data) {
                const { user } = res.data.login;

                const reduxUser = {
                    id: user.id,
                    email: user.email,
                    roles: user.roles || ['User'],
                };

                // Small delay to ensure authAfterware has processed the response headers
                await new Promise(resolve => setTimeout(resolve, 50));

                // Get the token that was set by authAfterware
                const token = store.getState().auth.token;

                // Pass both user and token to loginAction
                loginAction(reduxUser, token || undefined);

                toast.success("Welcome back!");
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error("Login error:", err);
            // Check for specific error message from backend
            const msg = err.message || "Invalid email or password";
            loginFailure(msg); // Use hook
            toast.error(msg);
            setLocalError(msg);
        }
    };

    const handleForgotEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!forgotEmail) {
            setLocalError('Please enter your email address.');
            return;
        }

        try {
            await forgotPasswordMutation({
                variables: { email: forgotEmail },
            });

            setStep('VERIFY_OTP');
            setTimer(60); // 1 minute
        } catch (err: any) {
            setLocalError(err.message || 'Failed to send OTP');
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        setLocalError(null);

        const code = otp.join('');
        if (code.length !== 6) {
            setLocalError('Please enter the complete 6-digit code.');
            return;
        }

        try {
            await verifyOtpMutation({
                variables: {
                    email: forgotEmail,
                    otp: code,
                },
            });

            setStep('RESET_PASSWORD');
        } catch (err: any) {
            setLocalError(err.message || 'Invalid or expired OTP');
        }
    };

    const handleResendCode = async () => {
        setLocalError(null);
        setSuccessMessage(null);
        try {
            await forgotPasswordMutation({
                variables: { email: forgotEmail },
            });
            setTimer(60);
            setSuccessMessage('Code resent! Please check your email.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setLocalError(err.message || 'Failed to resend code');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (newPassword !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setLocalError('Password must be at least 6 characters.');
            return;
        }

        try {
            await resetPasswordMutation({
                variables: {
                    email: forgotEmail,
                    newPassword,
                },
            });

            // Reset UI state
            setEmail(forgotEmail);
            setPassword('');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setConfirmPassword('');
            setStep('LOGIN');

            setSuccessMessage('Password reset successful. Please log in.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setLocalError(err.message || 'Failed to reset password');
        }
    };

    // Components - LogoHeader is now imported

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#F9F9F9] p-[8px] font-sans text-gray-900 overflow-hidden relative gap-[9px]">
            <LoginCarousel />

            <div className="w-[950px] h-full max-h-full bg-white border border-[#E8EAEE] rounded-xl flex flex-col p-6 shadow-sm overflow-hidden flex-none">
                <LogoHeader />

                <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-[196px]">
                    <div className="w-full max-w-[410px] mx-auto flex flex-col items-center">
                        {/* VIEW: LOGIN */}
                        {step === 'LOGIN' && (
                            <div className="w-full flex flex-col gap-6">
                                <h1 className="text-[32px] font-extrabold text-[#374151] mb-6 text-center leading-[40px]">Sign In to Your Account</h1>

                                <form onSubmit={handleLoginSubmit} className="space-y-6" autoComplete="off">
                                    <FloatingLabel
                                        id="login-email"
                                        label="Work Email Address"
                                        type="email"
                                        placeholder="e.g., john.doe@yourcompany.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="off"
                                    />

                                    <FloatingLabel
                                        id="login-password"
                                        label="Password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />

                                    {(authError || localError) && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError || localError}</div>}
                                    {successMessage && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">{successMessage}</div>}

                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full h-[36px] bg-[#4F46E5] border border-[#4338CA] text-white font-semibold rounded-lg shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.35)] hover:bg-[#4338CA] transition-all disabled:opacity-70"
                                        >
                                            {loading ? 'Logging in...' : 'Login'}
                                        </button>

                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => setStep('FORGOT_PASSWORD')}
                                                className="text-[12px] text-[#4F46E5] hover:underline"
                                            >
                                                forgot your password?
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center pt-2">
                                        <p className="text-[14px] leading-[20px] text-[#9CA3AF] max-w-[346px] mx-auto">
                                            By signing in, you agree to our{' '}
                                            <a href="#" className="font-italic italic text-[#4F46E5] underline decoration-[#4F46E5] underline-offset-4 hover:opacity-80 transition-opacity">Terms of Service</a>
                                            {' '}and{' '}
                                            <a href="#" className="font-italic italic text-[#4F46E5] underline decoration-[#4F46E5] underline-offset-4 hover:opacity-80 transition-opacity">Privacy Policy</a>.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}


                        {/* VIEW: FORGOT PASSWORD (EMAIL) */}
                        {step === 'FORGOT_PASSWORD' && (
                            <div className="w-full flex flex-col gap-6">
                                <h1 className="text-3xl font-bold text-[#374151] mb-2 text-center">Reset Password</h1>
                                <p className="text-gray-500 mb-4 text-center">Enter your email address to receive a verification code.</p>

                                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                                    <FloatingLabel
                                        id="forgot-email"
                                        label="Work Email Address"
                                        type="email"
                                        placeholder="e.g., john.doe@yourcompany.com"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                    />
                                    {localError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{localError}</div>}
                                    <button
                                        type="submit"
                                        disabled={forgotPasswordLoading}
                                        className="w-full h-[36px] bg-[#4F46E5] border border-[#4338CA] text-white font-semibold rounded-lg shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.35)] hover:bg-[#4338CA] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {forgotPasswordLoading ? 'Sending...' : 'Send Code'}
                                    </button>

                                    <button type="button" onClick={() => setStep('LOGIN')} className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700">
                                        Back to Login
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* VIEW: VERIFY OTP */}
                        {step === 'VERIFY_OTP' && (
                            <div className="flex flex-col items-center text-center w-full">
                                <h1 className="text-[32px] font-extrabold font-['Plus_Jakarta_Sans'] text-[#374151] mb-4 leading-[40px]">Verify your account</h1>
                                <p className="text-[16px] font-normal font-['Plus_Jakarta_Sans'] text-[#374151] mb-8 leading-[24px]">Enter the 6-digit code verify your account</p>

                                <div className="flex justify-between gap-2 max-w-[320px] mb-6 w-full">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                            className="w-10 h-10 sm:w-12 sm:h-12 border border-[#D1D5DB] rounded-lg text-center text-xl font-bold focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/20 bg-white focus:bg-[#F9FAFB] outline-hidden transition-all shadow-sm"
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between w-full text-sm text-gray-500 mb-8 max-w-[320px]">
                                    <span>Didn't receive the code?</span>
                                    {timer > 0 ? (
                                        <span className="text-orange-500 font-medium whitespace-nowrap">Resend Code in {timer}s</span>
                                    ) : (
                                        <button onClick={handleResendCode} className="text-[#4F46E5] font-medium hover:underline whitespace-nowrap">
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                {localError && <div className="mb-4 p-2 w-full bg-red-50 text-red-600 text-sm rounded-lg">{localError}</div>}
                                {successMessage && <div className="mb-4 p-2 w-full bg-green-50 text-green-600 text-sm rounded-lg">{successMessage}</div>}

                                <button onClick={handleVerifyOtp} className="w-full h-[36px] bg-[#4F46E5] border border-[#4338CA] text-white font-semibold rounded-lg shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.35)] hover:bg-[#4338CA] transition-all mb-4">
                                    Verify & Proceed
                                </button>

                                <p className="text-sm text-gray-400">Code valid for <span className="text-gray-900 font-semibold">1 minute</span>. Check spam if you don't see it.</p>
                            </div>
                        )}

                        {/* VIEW: RESET PASSWORD */}
                        {step === 'RESET_PASSWORD' && (
                            <div className="w-full flex flex-col gap-6">
                                <h1 className="text-3xl font-bold text-[#374151] mb-2 text-center">Set New Password</h1>
                                <p className="text-gray-500 mb-6 text-center">Please enter and confirm your new password.</p>

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <FloatingLabel
                                        id="new-password"
                                        label="New Password"
                                        type="password"
                                        placeholder="New password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />

                                    <FloatingLabel
                                        id="confirm-password"
                                        label="Confirm Password"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    {localError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{localError}</div>}
                                    {successMessage && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">{successMessage}</div>}
                                    <button type="submit" className="w-full h-[36px] bg-[#4F46E5] border border-[#4338CA] text-white font-semibold rounded-lg shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,0.35)] hover:bg-[#4338CA] transition-all">
                                        Reset Password
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};


