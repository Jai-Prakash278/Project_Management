import { ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { loginSuccess, setToken as setTokenAction, logout as logoutAction, loginStart as loginStartAction, loginFailure as loginFailureAction, User } from '../redux/slices/authSlice';

/**
 * Hook for accessing Auth state and actions.
 */
export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, token, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

    const handleLogin = (user: User, token?: string) => {
        dispatch(loginSuccess({ user, token }));
    };

    const handleLoginStart = () => {
        dispatch(loginStartAction());
    };

    const handleLoginFailure = (error: string) => {
        dispatch(loginFailureAction(error));
    };

    const handleSetToken = (token: string) => {
        dispatch(setTokenAction(token));
    };

    const handleLogout = () => {
        dispatch(logoutAction());
    };

    return {
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login: handleLogin,
        loginStart: handleLoginStart,
        loginFailure: handleLoginFailure,
        setToken: handleSetToken,
        logout: handleLogout,
        isAdmin: user?.roles?.includes('Admin'),
        isUser: user?.roles?.includes('User'),
    };
};

/**
 * Prop types for the Auth Render Component.
 */
interface AuthProps {
    children: (auth: ReturnType<typeof useAuth>) => ReactNode;
}

/**
 * A render-prop component to access Auth state in JSX.
 * Example:
 * <Auth>
 *   {({ user, isAuthenticated }) => (
 *      isAuthenticated ? <div>Hello {user?.email}</div> : <Login />
 *   )}
 * </Auth>
 */
export const Auth = ({ children }: AuthProps) => {
    const auth = useAuth();
    return <>{children(auth)}</>;
};

export default Auth;
