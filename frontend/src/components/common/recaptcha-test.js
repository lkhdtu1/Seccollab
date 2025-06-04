/**
 * reCAPTCHA v3 Test Script
 * 
 * This script can be added to debug reCAPTCHA issues.
 * To use, create a script tag in your index.html or add to your console.
 */

// Test reCAPTCHA with specific action
window.testReCaptchaV3 = function(action = 'test') {
  if (!window.grecaptcha || !window.grecaptcha.execute) {
    console.error('Error: grecaptcha not loaded or initialized correctly');
    return;
  }
  
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';
  if (!siteKey) {
    console.error('Error: No reCAPTCHA site key found');
    return;
  }

  console.log(`Testing reCAPTCHA v3 with action: ${action}`);
  
  try {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKey, { action })
        .then((token) => {
          console.log('✅ reCAPTCHA token generated successfully');
          console.log('Token: ', token.substring(0, 20) + '...');
          console.log(`Action used: ${action}`);
          
          // Optional: Verify token on backend
          console.log('To verify this token on the backend, send it to your verification endpoint');
        })
        .catch((error) => {
          console.error('❌ reCAPTCHA execution failed', error);
        });
    });
  } catch (error) {
    console.error('❌ Error executing reCAPTCHA', error);
  }
};

// Test if reCAPTCHA is properly loaded
window.checkReCaptchaStatus = function() {
  if (!window.grecaptcha) {
    console.error('❌ grecaptcha not found - script may not be loaded');
    return false;
  }
  
  if (!window.grecaptcha.execute) {
    console.error('❌ grecaptcha.execute not found - v3 may not be initialized');
    return false;
  }
  
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  console.log(`Current Site Key: ${siteKey ? 'Configured' : 'Not configured'}`);
  
  return true;
};

// Log status messages
console.log('✅ reCAPTCHA test utilities loaded');
console.log('Usage:');
console.log('- window.testReCaptchaV3("action_name") to test reCAPTCHA');
console.log('- window.checkReCaptchaStatus() to check if reCAPTCHA is loaded');
