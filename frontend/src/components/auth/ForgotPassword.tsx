import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';
import Captcha, { CaptchaHandle } from '../common/CaptchaComponent';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const captchaRef = useRef<CaptchaHandle>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await requestPasswordReset(email, captchaToken);
      setMessage('If an account exists with this email, you will receive password reset instructions.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        {message && (
          <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            {message}
          </div>
        )}

        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
            />          </div>
        </div>        {/* CAPTCHA Component */}
        <div className="mb-4">
          <Captcha
            ref={captchaRef}
            onVerify={setCaptchaToken}
            onError={() => {
              setError('CAPTCHA verification failed. Please try again.');
              setCaptchaToken(null);
            }}
            action="forgot_password"
            version="v3"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;