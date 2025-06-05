"""CAPTCHA utilities for the application."""
import requests
import os
from flask import current_app

def verify_recaptcha(token, ip_address=None, expected_action='register'):
    """
    Verify Google reCAPTCHA v3 token.
    
    Args:
        token (str): The reCAPTCHA token from the frontend
        ip_address (str): Optional IP address for additional verification
        expected_action (str): The expected action for this verification
    
    Returns:
        dict: Verification result with success status and score
    """
    if not token:
        return {'success': False, 'error': 'No CAPTCHA token provided'}

    secret_key = os.environ.get('RECAPTCHA_SECRET_KEY')
    
    # Handle development/test mode
    if current_app.config.get('TESTING', False) or current_app.config.get('DEBUG', False):
        if token in ['dev-token', 'test-token']:
            return {'success': True, 'score': 0.9, 'action': expected_action}
        if not secret_key:
            return {'success': True, 'score': 0.9, 'action': expected_action}
    
    if not secret_key:
        return {'success': False, 'error': 'CAPTCHA not configured'}

    try:
        # Prepare the request to Google's reCAPTCHA API
        data = {
            'secret': secret_key,
            'response': token
        }
        
        if ip_address:
            data['remoteip'] = ip_address

        # Make the verification request to Google
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data=data,
            timeout=5
        )
        result = response.json()

        # Check if verification was successful
        if not result.get('success', False):
            return {'success': False, 'error': 'CAPTCHA verification failed'}

        # Verify the action matches what we expect
        action = result.get('action')
        if action != expected_action:
            return {
                'success': False,
                'error': f'CAPTCHA action mismatch. Expected: {expected_action}, Got: {action}'
            }

        # Check the score
        score = result.get('score', 0)
        if score < 0.5:  # Minimum score threshold
            return {'success': False, 'error': 'CAPTCHA score too low'}

        return {
            'success': True,
            'score': score,
            'action': action
        }

    except Exception as e:
        return {'success': False, 'error': f'CAPTCHA verification error: {str(e)}'}

def verify_captcha_for_action(token, expected_action, ip_address=None):
    """
    Verify CAPTCHA token for a specific action.
    
    Args:
        token (str): The reCAPTCHA token
        expected_action (str): Expected action name (e.g., 'register', 'login', 'forgot_password')
        ip_address (str): Optional IP address
    
    Returns:
        dict: Verification result
    """
    result = verify_recaptcha(token, ip_address, expected_action)
    
    if not result['success']:
        return result
    
    # Check if the action matches what we expected
    if 'action' in result and result['action'] != expected_action:
        return {
            'success': False,
            'error': f'CAPTCHA action mismatch. Expected: {expected_action}, Got: {result.get("action")}'
        }
    
    return result
