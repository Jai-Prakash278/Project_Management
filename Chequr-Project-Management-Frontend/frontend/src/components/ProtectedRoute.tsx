import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const ProtectedRoute = () => {
    const { isAuthenticated, isInitializing } = useSelector((state: RootState) => state.auth);

    // Wait for AuthInitialize to finish its refresh attempt
    if (isInitializing) {
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
