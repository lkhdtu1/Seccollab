"""Authentication routes for the application."""
import os
import re
import secrets
import bcrypt
import json
import pyotp
import qrcode
import io
import base64
import requests
from datetime import datetime, timedelta

import bleach
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, current_app, url_for, session, redirect
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    get_jwt_identity, jwt_required, get_jwt
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Message, Mail
from authlib.integrations.flask_client import OAuth
from oauthlib.oauth2 import WebApplicationClient
from werkzeug.urls import url_parse
from werkzeug.utils import secure_filename
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.models.user import User, db
from app.utils.logging import log_action
from app.utils.captcha import verify_captcha_for_action
from app.config.config import Config
from app.utils.security import hash_password, check_password

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Email regex pattern
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_email(email):
    return bool(EMAIL_REGEX.match(email))

def sanitize_input(data):
    if isinstance(data, str):
        return bleach.clean(data)
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(i) for i in data]
    return data
auth_bp = Blueprint('auth', __name__)
load_dotenv("test.env")
mail = Mail()
oauth = OAuth()

client = oauth.register(
    'google',
    client_id= os.environ.get("GOOGLE_CLIENT_ID", "mock-client-id"),
    client_secret= os.environ.get("GOOGLE_CLIENT_SECRET", "mock-client-secret"),

    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={'scope': 'openid email profile'}
)
# Client OAuth2
#client = WebApplicationClient(os.environ.get("GOOGLE_CLIENT_ID", "mock-client-id"))


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    """Register a new user with enhanced security and CAPTCHA."""
    data = request.get_json()
    data = sanitize_input(data)
    
    if not all(k in data for k in ('email', 'password', 'name')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify CAPTCHA
    captcha_token = data.get('captcha_token')
    if not captcha_token:
        return jsonify({'error': 'CAPTCHA verification required'}), 400
    
    from app.utils.captcha import verify_captcha_for_action
    captcha_result = verify_captcha_for_action(
        captcha_token, 
        'register', 
        request.environ.get('REMOTE_ADDR')
    )
    
    if not captcha_result['success']:
        return jsonify({'error': f'CAPTCHA verification failed: {captcha_result.get("error", "Unknown error")}'}), 400
    
    # Normalize email to lowercase
    email = data['email'].lower().strip()
    
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
        
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400

    # Check if user already exists (case-insensitive)
    if User.email_exists(email):
        return jsonify({'error': 'Email already registered'}), 409
    
     # Hacher le mot de passe
    hashed_password = hash_password(data['password'])
    
    # Create new user with normalized email
    user = User(
        email=email,
        password=hashed_password,
        name=data['name']
    )
    # Enregistrer l'utilisateur dans la base de données
   #user.save()
    db.session.add(user)
    db.session.commit()
    
    # Log the action
    from app.utils.logging import log_action
    log_action('REGISTER', user.id, f"New user registered: {user.email}")
      # Create tokens for auto-login after registration
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=12)
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=timedelta(days=30)
    )

    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Initiate password reset process with CAPTCHA verification."""
    data = request.get_json()
    
    # Verify CAPTCHA
    captcha_token = data.get('captcha_token')
    if not captcha_token:
        return jsonify({'error': 'CAPTCHA verification required'}), 400
    
    from app.utils.captcha import verify_captcha_for_action
    captcha_result = verify_captcha_for_action(
        captcha_token, 
        'forgot_password', 
        request.environ.get('REMOTE_ADDR')
    )
    
    if not captcha_result['success']:
        return jsonify({'error': f'CAPTCHA verification failed: {captcha_result.get("error", "Unknown error")}'}), 400
    
    # Normalize email to lowercase for lookup
    email = data.get('email', '').lower().strip()
    user = User.get_by_email(email)
    
    if not user:
        # Don't reveal if email exists
        return jsonify({'message': 'If an account exists with this email, a reset link has been sent'}), 200
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=2)
    db.session.commit()
      # Send reset email
   #reset_url = f"{request.host_url}reset-password/{reset_token}"
    reset_url=f"{os.environ.get('FRONTEND_URL')}/reset-password/{reset_token}"
    
    try:
        # Use EmailBypass utility for reliable email sending
        from app.utils.EmailBypass import send_email_with_local_fallback
        
        success = send_email_with_local_fallback(
            to=email,
            subject='Password Reset Request - SecureCollab',
            body=f'''Hello,

You have requested to reset your password for your SecureCollab account.

To reset your password, please click the following link:
{reset_url}

This link will expire in 2 hours for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
SecureCollab Security Team'''
        )
        
        if success:
            print(f"✓ Password reset email sent successfully to {email}")
        else:
            print(f"✗ Failed to send password reset email to {email}")
            
    except Exception as mail_error:
        print(f"✗ Error sending password reset email: {str(mail_error)}")
    
    # Log the action
    from app.utils.logging import log_action
    log_action('FORGOT_PASSWORD', user.id, f"Password reset requested for: {user.email}")
    
    return jsonify({'message': 'If an account exists with this email, a reset link has been sent'}), 200

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """Reset password using token."""
    data = request.get_json()
    new_password = data.get('password')
    
    if not new_password:
        return jsonify({'error': 'New password is required'}), 400
    
    user = User.query.filter_by(password_reset_token=token).first()
    
    if not user or not user.password_reset_expires or user.password_reset_expires < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    user.password = (hash_password(new_password))
    #user.password = 
    
    user.password_reset_token = None
    user.password_reset_expires = None
    db.session.add(user)
    db.session.commit()
    
    # Log the action
    from app.utils.logging import log_action
    log_action('RESET_PASSWORD', user.id, f"Password reset successfully for: {user.email}")
    
    return jsonify({'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Login with rate limiting and enhanced security."""
    data = request.get_json()
    data = sanitize_input(data)

    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Normalize email to lowercase for lookup
    email = data['email'].lower().strip()
    user = User.get_by_email(email)
    
    if not user or not check_password(data['password'], user.password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Check if user has MFA enabled
    if user.mfa_enabled:
        # Return MFA required response
        return jsonify({
            'mfa_required': True,
            'user_id': user.id,
            'message': 'MFA verification required'
        }), 200

    # If no MFA required, proceed with normal login flow
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=12)
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=timedelta(days=30)
    )
      # Update daily login count
    today = datetime.utcnow().date()
    if user.last_login_date != today:
        user.daily_login_count = 1
        user.last_login_date = today
    else:
        user.daily_login_count += 1
    
    db.session.commit()
    
    # Log the successful login
    log_action('LOGIN', user.id, f"User logged in: {user.email}")
    
    response_data = {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'mfa_enabled': user.mfa_enabled,
            'avatar_url': user.avatar_url if hasattr(user, 'avatar_url') else None
        },
        'expires_in': 43200  # 12 hours in seconds
    }
    
    response = jsonify(response_data)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'no-cache'
    
    return response, 200
    
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        access_token = create_access_token(
            identity=str(current_user_id),
            expires_delta=timedelta(hours=12)
        )
        refresh_token = create_refresh_token(
            identity=str(current_user_id),
            expires_delta=timedelta(days=30)
        )
        
        # Log the action
        log_action('REFRESH_TOKEN', current_user_id, "Access token refreshed")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'mfa_enabled': user.mfa_enabled
            }
        }), 200
        
    except Exception as e:
        print(f"Error in refresh: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 401
    
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user by revoking tokens."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
      # Log the action
    from app.utils.logging import log_action
    log_action('LOGOUT', current_user_id, f"User logged out: {user.email}")
    
    return jsonify({'message': 'Successfully logged out'}), 200

@auth_bp.route('/mfa/setup', methods=['GET'])
@jwt_required()

def mfa_setup():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Generate a new MFA secret and save it
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    db.session.commit()  # Critical: persist the secret

    # Create QR code
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name=current_app.config['MFA_ISSUER_NAME']
    )
    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer)
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

    return jsonify({
        'secret': secret,
        'qr_code': qr_code_base64
    })


@auth_bp.route('/mfa/enable', methods=['POST'])
@jwt_required()
def mfa_enable():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    code = data.get('code')

    # Log the stored secret and expected code
    print("Stored secret:", user.mfa_secret)
    expected_code = pyotp.TOTP(user.mfa_secret).now()
    print("Expected TOTP code:", expected_code)
    print("Submitted code:", code)

    # Verify the provided code
    if not user.verify_mfa_code(code):
        return jsonify({'error': 'Invalid verification code'}), 400

    # Enable MFA
    user.mfa_enabled = True
    db.session.commit()

    return jsonify({'message': 'MFA enabled successfully'})


@auth_bp.route('/mfa/disable', methods=['POST'])
@jwt_required()
def mfa_disable():
    """Disable MFA for user."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # For security, require password verification to disable MFA
    if not user.check_password(data.get('password')):
        return jsonify({'error': 'Invalid password'}), 401
    
    # Disable MFA
    user.mfa_enabled = False
    user.mfa_secret = None
    
    # Clear trusted devices
    user.trusted_devices.delete()
    db.session.commit()
    
    return jsonify({'message': 'MFA disabled successfully'})

@auth_bp.route('/mfa/verify', methods=['POST'])
def mfa_verify():
    """Verify MFA code during login with a time window."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        code = data.get('code')
        
        if not user_id or not code:
            return jsonify({'error': 'Missing required fields'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Add time window validation (30 seconds before and after)
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(code, valid_window=1):  # Window of 1 means ±30 seconds
            return jsonify({'error': 'Invalid verification code'}), 400
        
        # Create tokens with explicit expiration
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=12)
        )
        refresh_token = create_refresh_token(
            identity=str(user.id),
            expires_delta=timedelta(days=30)
        )
        
        response_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'mfa_enabled': user.mfa_enabled,
                'avatar_url': user.avatar_url if hasattr(user, 'avatar_url') else None
            },
            'expires_in': 43200  # 12 hours in seconds
        }        # Handle remember device option
        if data.get('remember_device'):
            device_id = secrets.token_urlsafe(32)
            user.add_trusted_device(
                request.headers.get('User-Agent', ''),
                request.remote_addr
            )
            db.session.commit()
            
            response = jsonify(response_data)
            response.set_cookie(
                'device_id',
                device_id,
                max_age=30*24*60*60,  # 30 days
                httponly=True,
                secure=not current_app.config['DEBUG'],
                samesite='Lax'
            )
            return response

        return jsonify(response_data), 200

    except Exception as e:
        print(f"MFA verification error: {str(e)}")
        return jsonify({'error': 'MFA verification failed'}), 500

def get_google_auth_url():
    """Get Google OAuth URL without DNS discovery"""
    client_id = current_app.config['GOOGLE_CLIENT_ID']
    redirect_uri = f"{current_app.config['APP_URL']}/api/auth/callback/google"
    scope = "openid email profile"
    
    return (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        f"scope={scope}"
    )


@auth_bp.route('/login/google')
def google_login():
    """Initiate Google OAuth flow"""
    try:
        # Clear any existing session data
        session.clear()
        
        # Generate and store state
        state = secrets.token_urlsafe(32)
        session['oauth_state'] = state
        session.permanent = True
        
        current_app.logger.debug(f"Storing state in session: {state}")
        
        # Get redirect URI
        redirect_uri = url_for('auth.google_callback', _external=True)
        
        return oauth.google.authorize_redirect(
            redirect_uri=redirect_uri,
            state=state
        )
    except Exception as e:
        current_app.logger.error(f"Google login error: {str(e)}")
        return jsonify({"error": str(e)}), 503

@auth_bp.route('/login/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    try:
        # Debug log the session and state
        current_app.logger.debug(f"Session data: {session}")
        current_app.logger.debug(f"Received state: {request.args.get('state')}")
        current_app.logger.debug(f"Stored state: {session.get('oauth_state')}")
        
        # Verify state
        state = request.args.get('state')
        stored_state = session.get('oauth_state')
        
        if not state or not stored_state or state != stored_state:
            current_app.logger.error(f"State mismatch. Received: {state}, Stored: {stored_state}")
            return redirect(f"{current_app.config['FRONTEND_URL']}/login?error=invalid_state")
        
        # Get token and user info
        token = oauth.google.authorize_access_token()
        userinfo = oauth.google.parse_id_token(token)
        
        # Clear session state
        session.pop('oauth_state', None)
        
        # Get or create user
        user = User.query.filter_by(email=userinfo['email']).first()
        if not user:
            user = User(
                email=userinfo['email'],
                name=userinfo.get('name', ''),
                google_id=userinfo['sub'],
                email_verified=userinfo.get('email_verified', False)
            )
            db.session.add(user)
            db.session.commit()
        
        # Create tokens
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=1)
        )
        
        # Redirect with token
        return redirect(
            f"{current_app.config['FRONTEND_URL']}/auth/callback"
            f"?token={access_token}"
            f"&user_id={user.id}"
        )
        
    except Exception as e:
        current_app.logger.error(f"Callback error: {str(e)}")
        return redirect(f"{current_app.config['FRONTEND_URL']}/login?error=auth_failed")




@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        # Handle both JSON and multipart form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
            
        if 'name' in data:
            user.name = data['name']
        if 'email' in data and data['email'] != user.email:
            # Normalize the new email
            new_email = data['email'].lower().strip()
            
            # Check if email is already taken (case-insensitive)
            if User.email_exists(new_email):
                return jsonify({'error': 'Email already in use'}), 409
            user.email = new_email
        if 'avatar' in data:
            user.avatar_url = data['avatar']
            
        # Update password changed timestamp
        user.password_changed_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        log_action('UPDATE_PROFILE', current_user_id, f"Profile updated: {user.email}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'avatar_url': user.avatar_url,
                'mfa_enabled': user.mfa_enabled
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password with verification."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        data = request.get_json()
        
        if not all(k in data for k in ('current_password', 'new_password')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify current password
        if not check_password(data['current_password'], user.password):
            log_action('FAILED_PASSWORD_CHANGE', current_user_id, f"Failed password change attempt: incorrect current password")
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        if len(data['new_password']) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400
        
        # Hash and update password
        user.password = hash_password(data['new_password'])
        user.password_changed_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        log_action('PASSWORD_CHANGED', current_user_id, f"Password changed successfully")
        
        return jsonify({'message': 'Password changed successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error changing password: {str(e)}")
        return jsonify({'error': 'Failed to change password'}), 500

def allowed_file(filename):
    """Check if file type is allowed for avatars."""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS







@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with their current status."""
    try:
        # Get current user from token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Invalid authentication token'}), 401

        # Fetch all users except current user
        users = User.query.filter(User.id != current_user_id).all()
        
        return jsonify({
            'users': [
                {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'avatar_url': user.avatar_url if hasattr(user, 'avatar_url') else None,
                    'is_active': getattr(user, 'is_active', 0)  # Default to inactive if not set
                }
                for user in users
            ]
        })
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create fresh token if needed
        token_info = get_jwt()
        exp_timestamp = token_info['exp']
        current_timestamp = datetime.utcnow().timestamp()
        
        response_data = {
            'user': user.to_dict()
        }

        # If token expires in less than 30 minutes, refresh it
        if exp_timestamp - current_timestamp < 1800:
            access_token = create_access_token(
                identity=str(user.id),
                expires_delta=timedelta(hours=12)
            )
            response_data['access_token'] = access_token

        return jsonify(response_data), 200
            
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 401









