# reCAPTCHA v3 Integration Guide

This document explains how the reCAPTCHA v3 integration works in the SecureCollab platform and how to maintain it.

## Overview

The application uses Google reCAPTCHA v3 to protect forms from bots and spam. Unlike reCAPTCHA v2 which requires user interaction, v3 works invisibly in the background, assigning a score to each interaction without requiring the user to solve puzzles.

## Components

1. **CaptchaComponent.tsx** - The core component that wraps the reCAPTCHA functionality.
2. **TestCaptcha.tsx** - A test page for verifying the reCAPTCHA integration.
3. **Backend verification** - Server-side validation in `backend/app/utils/captcha.py`.

## How It Works

### Frontend

1. The `CaptchaComponent` renders an invisible reCAPTCHA widget and automatically executes it when mounted.
2. Each form (Register, ForgotPassword, etc.) specifies a unique action name (e.g., "register", "forgot_password").
3. The component executes reCAPTCHA with the specified action and returns a token.

### Backend

1. The server receives the token along with the form submission.
2. The `verify_captcha_for_action` function validates:
   - The token is valid (not expired or forged)
   - The action matches what's expected for that form
   - The score is above the minimum threshold (default is 0.5)

## Configuration

### Production Environment

In production, you need to set these environment variables:

1. Frontend: `.env` file:
   ```
   REACT_APP_RECAPTCHA_SITE_KEY=your_site_key
   ```

2. Backend: Environment variables:
   ```
   RECAPTCHA_SECRET_KEY=your_secret_key
   RECAPTCHA_MIN_SCORE=0.5  # Optional, defaults to 0.5
   ```

### Development Environment

For development, the system will automatically fall back to a development mode and bypass actual reCAPTCHA verification if:

1. The site key is set to "dev-mode" or "development"
2. The `NODE_ENV` is set to "development" and a reCAPTCHA error occurs

## Troubleshooting

### "This reCAPTCHA is for test purposes only" Error

This error occurs when using Google's testing keys. To fix it:

1. Create your own reCAPTCHA v3 keys at the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2. Add your domain to the allowed domains list in the admin console.
3. Update your environment variables with the new keys.

### Testing reCAPTCHA Integration

Use the `TestCaptcha` component to test your integration:

1. Navigate to `/test-captcha` in your application.
2. The test page will show if your keys are configured correctly and if tokens are being generated.
3. You can also use the `recaptcha-test.js` utilities by importing them in your console.

## Maintenance

When updating the application, ensure:

1. Each sensitive form has a unique action name
2. Backend validation is checking for the correct action
3. The reCAPTCHA site key and secret are rotated periodically for security
4. Token verification includes IP address validation in high-security contexts

## Related Files

- `frontend/src/components/common/CaptchaComponent.tsx`
- `frontend/src/components/TestCaptcha.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/auth/ForgotPassword.tsx`
- `backend/app/utils/captcha.py`

## References

- [Google reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [React Google reCAPTCHA library](https://github.com/dozoisch/react-google-recaptcha)
