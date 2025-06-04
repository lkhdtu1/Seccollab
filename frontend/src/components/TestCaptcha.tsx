import React, { useState, useRef } from 'react';
import Captcha, { CaptchaHandle } from './common/CaptchaComponent';

const TestCaptcha: React.FC = () => {
  const captchaRef = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCaptchaVerify = (token: string | null) => {
    setCaptchaToken(token);
    if (token) {
      addResult(`✅ CAPTCHA token received: ${token.substring(0, 20)}...`);
    } else {
      addResult(`❌ CAPTCHA verification failed`);
    }
  };

  const handleCaptchaError = () => {
    addResult(`⚠️ CAPTCHA error occurred`);
  };

  const handleCaptchaExpired = () => {
    addResult(`⏰ CAPTCHA token expired`);
  };

  const testManualExecution = () => {
    if (captchaRef.current) {
      addResult(`🔄 Manually executing CAPTCHA...`);
      captchaRef.current.execute();
    }
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      addResult(`🔄 Resetting CAPTCHA...`);
      captchaRef.current.reset();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">reCAPTCHA v3 Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CAPTCHA Test Component */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">CAPTCHA Component Test</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current reCAPTCHA Site Key:
                </label>
                <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                  {process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'Not configured'}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  reCAPTCHA v3 Component:
                </label>
                <div className="border border-gray-200 p-4 rounded">
                  <Captcha
                    ref={captchaRef}
                    onVerify={handleCaptchaVerify}
                    onError={handleCaptchaError}
                    onExpired={handleCaptchaExpired}
                    version="v3"
                    action="test"
                    autoExecute={true}
                    className="mb-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Token:
                </label>
                <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                  {captchaToken || 'No token received yet'}
                </code>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testManualExecution}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Execute CAPTCHA
                </button>
                <button
                  onClick={resetCaptcha}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset CAPTCHA
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Environment:</span>
                <span className="text-sm text-gray-600">{process.env.NODE_ENV}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Site Key Status:</span>
                <span className={`text-sm ${process.env.REACT_APP_RECAPTCHA_SITE_KEY && process.env.REACT_APP_RECAPTCHA_SITE_KEY.length > 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.REACT_APP_RECAPTCHA_SITE_KEY && process.env.REACT_APP_RECAPTCHA_SITE_KEY.length > 10 ? 'Configured' : 'Not Configured'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Token Status:</span>
                <span className={`text-sm ${captchaToken ? 'text-green-600' : 'text-red-600'}`}>
                  {captchaToken ? 'Token Received' : 'No Token'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Activity Log:</h3>
              <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">No activity yet...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="text-xs font-mono mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
              
              <button
                onClick={() => setTestResults([])}
                className="mt-2 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              >
                Clear Log
              </button>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <h3 className="font-medium text-gray-700">Frontend Configuration</h3>
              <div className={`mt-2 text-lg font-bold ${process.env.REACT_APP_RECAPTCHA_SITE_KEY && process.env.REACT_APP_RECAPTCHA_SITE_KEY.length > 10 ? 'text-green-600' : 'text-red-600'}`}>
                {process.env.REACT_APP_RECAPTCHA_SITE_KEY && process.env.REACT_APP_RECAPTCHA_SITE_KEY.length > 10 ? '✅ Configured' : '❌ Missing'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded">
              <h3 className="font-medium text-gray-700">CAPTCHA Component</h3>
              <div className={`mt-2 text-lg font-bold ${captchaToken ? 'text-green-600' : 'text-yellow-600'}`}>
                {captchaToken ? '✅ Working' : '⏳ Waiting'}
              </div>
            </div>
            
            <div className="text-center p-4 border rounded">
              <h3 className="font-medium text-gray-700">Version</h3>
              <div className="mt-2 text-lg font-bold text-blue-600">
                v3 Invisible
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaptcha;
