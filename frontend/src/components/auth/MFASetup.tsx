import React, { useState, useEffect } from 'react';
import { setupMfa, enableMfa } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface MFASetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onSetupComplete, onCancel }) => {
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const getMfaSetup = async () => {
      try {
        setIsLoading(true);
        const { secret, qr_code } = await setupMfa();
        setSecret(secret);
        setQrCode(qr_code);
      } catch (err: any) {
        setError(err.message || 'Failed to set up MFA. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    getMfaSetup();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      await enableMfa(verificationCode);
      setIsSuccess(true);
      setIsRedirecting(true);
      onSetupComplete();
      setTimeout(() => {
        navigate('/hub');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setVerificationCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Set Up Two-Factor Authentication
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {step === 1 && (
              <>
                <div className="text-sm text-gray-600 space-y-4">
                  <p>
                    Two-factor authentication adds an extra layer of security to your account.
                    Once enabled, you'll need both your password and a verification code to sign in.
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Download an authenticator app like Google Authenticator or Authy</li>
                    <li>Scan the QR code or enter the setup key manually</li>
                    <li>Enter the verification code from the app to complete setup</li>
                  </ol>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-sm text-gray-600 space-y-4">
                  <p className="font-medium">Step 1: Scan this QR code with your authenticator app</p>
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code for MFA setup"
                      className="border p-2 rounded"
                    />
                  </div>

                  <p className="font-medium mt-4">Or enter this code manually:</p>
                  <div className="flex justify-center">
                    <div className="bg-gray-100 px-4 py-2 rounded-md text-lg font-mono tracking-wider break-all text-center">
                      {formatSecret(secret)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <form onSubmit={handleVerify} className="space-y-6">
                {error && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                    Enter verification code from your authenticator app
                  </label>
                  <input
                    id="verification-code"
                    name="verification-code"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify and Enable'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 text-sm">
              <button onClick={onCancel} className="text-indigo-600 hover:text-indigo-500">
                Cancel setup
              </button>
            </div>

            {isSuccess && (
              <div className="mt-4 text-green-600">
                <p className="font-medium">MFA setup successful!</p>
                {isRedirecting ? (
                  <p>Redirecting to your dashboard...</p>
                ) : (
                  <p>You can now use MFA for added security.</p>
                )}
                {isRedirecting && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MFASetup;
