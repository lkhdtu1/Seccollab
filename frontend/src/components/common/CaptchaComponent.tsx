import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

// Declare ReCAPTCHA v3 types
interface ReCaptchaV3 {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha: ReCaptchaV3;
  }
}

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: 'compact' | 'normal' | 'invisible';
  theme?: 'light' | 'dark';
  className?: string;
  action?: string;
  version?: 'v2' | 'v3';
  autoExecute?: boolean;
}

export interface CaptchaHandle {
  reset: () => void;
  execute: () => void;
}

const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({
  onVerify,
  onExpired,
  onError,
  size = 'invisible',
  theme = 'light',
  className = '',
  action = 'register',
  version = 'v3',
  autoExecute = true
}, ref) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  // Define handlers first to avoid use-before-define errors
  const handleCaptchaExpired = useCallback(() => {
    console.log('reCAPTCHA token expired');
    if (onExpired) {
      onExpired();
    }
  }, [onExpired]);

  const handleCaptchaError = useCallback(() => {
    console.warn('reCAPTCHA error occurred - checking common issues:');
    console.warn('1. Site key may be invalid');
    console.warn('2. Domain not registered for this site key');
    console.warn('3. Network connectivity issues');
    console.warn('4. reCAPTCHA service temporarily unavailable');
    
    if (onError) {
      onError();
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Auto-providing dev token');
      onVerify('dev-token');
    }
  }, [onError, onVerify]);

  const handleCaptchaChange = useCallback((token: string | null) => {
    console.log('reCAPTCHA token received:', token ? 'Valid token' : 'No token');
    onVerify(token);
  }, [onVerify]);

  const executeReCaptcha = useCallback(async () => {
    if (version === 'v3') {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        if (onVerify) {
          onVerify(token);
        }
      } catch (error) {
        console.error('reCAPTCHA execution error:', error);
        if (onError) {
          onError();
        }
      }
    } else {
      recaptchaRef.current?.execute();
    }
  }, [action, onError, onVerify, siteKey, version]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      recaptchaRef.current?.reset();
    },
    execute: executeReCaptcha
  }), [executeReCaptcha]);

  const isTestKey = siteKey === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  const isDevMode = siteKey === 'dev-mode' || siteKey === 'development';
  const isValidSiteKey = siteKey && 
    siteKey !== 'your-recaptcha-site-key' && 
    siteKey !== 'your-site-key' && 
    siteKey.length > 10 &&
    !isTestKey &&
    !isDevMode;

  useEffect(() => {
    if (isValidSiteKey && version === 'v3' && size === 'invisible' && autoExecute) {
      const timer = setTimeout(executeReCaptcha, 100);
      return () => clearTimeout(timer);
    }
  }, [isValidSiteKey, version, size, autoExecute, executeReCaptcha]);

  if (!isValidSiteKey || isDevMode) {
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
