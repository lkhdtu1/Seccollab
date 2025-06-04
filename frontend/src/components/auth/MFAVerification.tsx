import React, { useState, useRef, useEffect } from 'react';
import { verifyMfaCode } from '../services/authService';
import { AuthResponse } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
interface MFAVerificationProps {
  userId: number;
  onSuccess: (response: AuthResponse) => void;
  onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ userId, onSuccess, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  // Focus on the first input on mount
  useEffect(() => {
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to the next field
    if (value && index < 5 && inputs.current[index + 1]) {
      if (inputs.current[index + 1]) {
        inputs.current[index + 1]!.focus();
      }
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value && newCode.every(digit => digit)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // On backspace, go to the previous field if the current field is empty
    if (e.key === 'Backspace' && !code[index] && index > 0 && inputs.current[index - 1]) {
      if (inputs.current[index - 1]) {
        inputs.current[index - 1]!.focus();
      }
    }
  };

  const handleSubmit = async (verificationCode?: string) => {
  try {
    setIsLoading(true);
    setError('');

    const codeToVerify = verificationCode || code.join('');
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    const response = await verifyMfaCode({
      userId: userId.toString(),
      code: codeToVerify,
      rememberDevice
    });

    if (response.access_token) {
        // Store tokens and user data
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        // Call onSuccess callback
        onSuccess(response);
        
        // Navigate to hub
        console.log('Navigating to hub...'); // Debug log
        navigate('/hub', { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('MFA verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Two-Factor Authentication</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-center space-x-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <div className="flex items-center">
          <input
            id="remember-device"
            name="remember-device"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
          />
          <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-900">
            Trust this device for 30 days
          </label>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading || code.some((digit) => !digit)}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MFAVerification;