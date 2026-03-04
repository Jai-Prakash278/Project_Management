import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client/react';
import AppRoutes from './routes';
import { ProjectProvider } from './context/ProjectContext';
import { REFRESH_TOKEN_MUTATION } from './graphql/auth.mutation';
import { loginSuccess, logout, setInitializing } from './redux/slices/authSlice';

function URLSanitizer() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.includes('//')) {
      const cleanPath = location.pathname.replace(/\/+/g, '/');
      navigate(`${cleanPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function AuthInitialize({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [refreshToken] = useMutation<{ refreshToken: { user: any, token: string } }>(REFRESH_TOKEN_MUTATION);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await refreshToken();
        if (data?.refreshToken?.user) {
          dispatch(loginSuccess({
            user: data.refreshToken.user,
            // The new access token is already handled by Apollo authAfterware but we can explicitly set it if needed 
            // from data.refreshToken.token (if we had requested it in the GraphQL query)
          }));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        console.error("Failed to restore session via refresh token", error);
        dispatch(logout()); // Ensure Redux clears if cookie is invalid
      } finally {
        dispatch(setInitializing(false));
      }
    };

    initAuth();
  }, [dispatch, refreshToken]);

  return <>{children}</>;
}

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 2000,
          success: {
            duration: 2000,
          },
          error: {
            duration: 2000,
          },
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
        containerStyle={{
          top: 40,
          zIndex: 99999,
        }}
      />
      <Router>
        <ProjectProvider>
          <AuthInitialize>
            <URLSanitizer />
            <AppRoutes />
          </AuthInitialize>
        </ProjectProvider>
      </Router>
    </>
  );
}

export default App;
