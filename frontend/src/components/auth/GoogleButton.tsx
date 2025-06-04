
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MFAVerification from './MFAVerification';
import { API_BASE_URL } from '../config/config';
import { initiateGoogleAuth } from '../utils/networkUtils';
import { checkAuthServerConnection} from '../services/authService';
interface GoogleLoginButtonProps {
  onSuccess: (userData: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const mfaRequired = params.get('mfa_required');
    const userId = params.get('user_id');

    if (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
      return;
    }

    if (mfaRequired && userId) {
      setMfaRequired(true);
      setUserId(parseInt(userId));
      setIsLoading(false);
      return;
    }

    if (accessToken) {
      // Handle successful login
      onSuccess({ access_token: accessToken });
      navigate('/dashboard');
    }
  }, [navigate, onSuccess]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  };


  const handleMfaSuccess = (userData: any) => {
    onSuccess(userData);
    navigate('/hub');
  };

  // Show MFA verification if required
  if (mfaRequired && userId) {
    return (
      <MFAVerification 
        userId={userId} 
        onSuccess={handleMfaSuccess}
        onCancel={() => {
          setMfaRequired(false);
          navigate('/login');
        }}
      />
    );
  }



  

  return (
     <div className="w-full">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
        </g>
      </svg>
      {isLoading ? 'Connecting...' : 'Sign in with Google'}
    </button>
    </div>
  );
};

export default GoogleLoginButton;