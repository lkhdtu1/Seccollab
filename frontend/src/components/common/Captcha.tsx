import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal' | 'invisible';
  theme?: 'light' | 'dark';
  className?: string;
  action?: string; // For reCAPTCHA v3
  version?: 'v2' | 'v3';
  autoExecute?: boolean; // For v3 invisible
}

export interface CaptchaHandle {
  reset: () => void;
  execute: () => void;
}

const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({
  onVerify,
  onExpired,
  onError,
  size = 'invisible', // Default to invisible for v3
  theme = 'light',
  className = '',
  action = 'submit',
  version = 'v3',
  autoExecute = true
}, ref) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      recaptchaRef.current?.reset();
    },
    execute: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.execute();
      }
    }
  }));

  // Enhanced error handler for CAPTCHA
  const handleCaptchaError = useCallback(() => {
    console.warn('reCAPTCHA error occurred - checking common issues:');
    console.warn('1. Site key may be invalid');
    console.warn('2. Domain not registered for this site key');
    console.warn('3. Network connectivity issues');
    console.warn('4. reCAPTCHA service temporarily unavailable');
    
    if (onError) {
      onError();
    }
    
    // In development, automatically fall back to dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Auto-providing dev token');
      onVerify('dev-token');
    }
  }, [onError, onVerify]);

  const handleCaptchaChange = useCallback((token: string | null) => {
    console.log('reCAPTCHA token received:', token ? 'Valid token' : 'No token');
    onVerify(token);
  }, [onVerify]);

  const handleCaptchaExpired = useCallback(() => {
    console.log('reCAPTCHA token expired');
    if (onExpired) {
      onExpired();
    }
  }, [onExpired]);

  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  // Check if site key is properly configured
  const isTestKey = siteKey === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  const isDevMode = siteKey === 'dev-mode' || siteKey === 'development';
  const isValidSiteKey = siteKey && 
    siteKey !== 'your-recaptcha-site-key' && 
    siteKey !== 'your-site-key' && 
    siteKey.length > 10 &&
    !isTestKey &&
    !isDevMode;

  // Auto-execute for v3 invisible CAPTCHA
  useEffect(() => {
    if (isValidSiteKey && version === 'v3' && size === 'invisible' && autoExecute && recaptchaRef.current) {
      // Small delay to ensure the component is fully loaded
      const timer = setTimeout(() => {
        recaptchaRef.current?.execute();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isValidSiteKey, version, size, autoExecute]);

  if (!isValidSiteKey || isDevMode) {
    // In development, show a warning
    if (process.env.NODE_ENV === 'development') {
      const message = isTestKey 
        ? "Using Google test keys - switching to development mode" 
        : isDevMode
        ? "Development mode enabled - CAPTCHA disabled"
        : "CAPTCHA not configured. Set REACT_APP_RECAPTCHA_SITE_KEY in your .env file.";
      
      return (
        <div className={`p-3 bg-yellow-100 border border-yellow-400 rounded-md text-yellow-800 text-sm ${className}`}>
          <p>⚠️ {message}</p>
          <p className="text-xs mt-1">Current value: {siteKey || 'undefined'}</p>
          <button
            type="button"
            onClick={() => onVerify('dev-token')}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
          >
            Skip CAPTCHA (Dev Mode)
          </button>
        </div>
      );
    }
    
    return (
      <div className={`p-3 bg-red-100 border border-red-400 rounded-md text-red-800 text-sm ${className}`}>
        CAPTCHA service unavailable. Please try again later.
      </div>
    );
  }

  // For reCAPTCHA v3, we use invisible size and execute programmatically
  const finalSize = version === 'v3' ? 'invisible' : size;

  return (
    <div className={className}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleCaptchaChange}
        onExpired={handleCaptchaExpired}
        onErrored={handleCaptchaError}
        size={finalSize}
        theme={theme}
        badge={version === 'v3' ? 'bottomright' : undefined}
      />
      {version === 'v3' && (
        <div className="text-xs text-gray-500 mt-1">
          Protected by reCAPTCHA v3
        </div>
      )}
    </div>
  );
});

Captcha.displayName = 'Captcha';

export default Captcha;
