import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client/react';
import { RootState } from '../redux/store';
import { loginSuccess, logout } from '../redux/slices/authSlice';
import { REFRESH_TOKEN_MUTATION } from '../graphql/auth.mutation';

const ProtectedRoute = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [checking, setChecking] = useState(!isAuthenticated);
    const [refreshToken] = useMutation(REFRESH_TOKEN_MUTATION);

    useEffect(() => {
        if (isAuthenticated) {
            setChecking(false);
            return;
        }

        // Attempt to refresh the access token using the HttpOnly cookie
        refreshToken()
            .then((res) => {
                if ((res.data as any)?.refreshToken?.user) {
                    const { user } = (res.data as any).refreshToken;
                    dispatch(
                        loginSuccess({
                            user: {
                                id: user.id,
                                email: user.email,
                                roles: user.roles || [],
                            },
                        })
                    );
                } else {
                    dispatch(logout());
                }
            })
            .catch(() => {
                dispatch(logout());
            })
            .finally(() => {
                setChecking(false);
            });
    }, []); // Run once on mount

    if (checking) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <span>Loading...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
