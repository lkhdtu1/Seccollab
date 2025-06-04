
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error');

    if (error) {
      console.error('Auth error:', error);
      navigate('/login?error=auth_failed');
      return;
    }

    if (accessToken && refreshToken) {
      if (login) {
        login({ accessToken, refreshToken });
        navigate('/dashboard');
      } else {
        console.error('Login function is not available.');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [location, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p>Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
};

export default AuthCallback;