from datetime import timedelta
from flask import Flask, send_from_directory, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config.config import Config
import dns.resolver
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from app.routes.auth import auth_bp,mail,oauth
from authlib.integrations.flask_client import OAuth
import os
import secrets
from flask_talisman import Talisman

from app.routes.files2  import files_bp
import eventlet

from app.DNS import create_session_with_retries, setup_dns_resolver

# Import security middleware for advanced protection
from app.utils.security_middleware import (
    add_security_headers, 
    check_honeypot_traps,
    SecurityManager
)


def create_app(config_class=Config):
    # Configure eventlet before anything else
    eventlet.monkey_patch(socket=True, select=True)
    
    app = Flask(__name__)
    app.config.from_object(config_class)
      # Apply advanced security middleware to all requests
    @app.before_request
    def security_checks():
        """Apply comprehensive security checks to all incoming requests"""
        client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
        
        # 1. Check if IP is blocked
        if SecurityManager.is_ip_blocked(client_ip):
            from flask import jsonify
            return jsonify({
                'error': 'Access temporarily blocked due to suspicious activity',
                'code': 'IP_BLOCKED'
            }), 429
          # 2. Apply selective rate limiting - only for sensitive endpoints
        sensitive_endpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', 
                             '/api/auth/reset-password', '/api/auth/change-password']
        
        if request.endpoint and any(endpoint in request.path for endpoint in sensitive_endpoints):
            if SecurityManager.check_rate_limit(client_ip, request_type='auth'):
                from flask import jsonify
                return jsonify({
                    'error': 'Rate limit exceeded for authentication. Please wait a moment.',
                    'code': 'AUTH_RATE_LIMITED'
                }), 429
        elif request.path.startswith('/api/'):
            # Apply moderate rate limiting to API endpoints
            if SecurityManager.check_rate_limit(client_ip, request_type='api'):
                from flask import jsonify
                return jsonify({
                    'error': 'API rate limit exceeded. Please slow down.',
                    'code': 'API_RATE_LIMITED'
                }), 429
        elif request.path.startswith('/static/'):
            # Very permissive for static files
            if SecurityManager.check_rate_limit(client_ip, request_type='static'):
                from flask import jsonify
                return jsonify({
                    'error': 'Too many requests for static resources.',
                    'code': 'STATIC_RATE_LIMITED'
                }), 429
        else:
            # General rate limiting for other requests
            if SecurityManager.check_rate_limit(client_ip, request_type='general'):
                from flask import jsonify
                return jsonify({
                    'error': 'General rate limit exceeded.',
                    'code': 'GENERAL_RATE_LIMITED'
                }), 429
        
        # 3. Check for suspicious user agents
        user_agent = request.headers.get('User-Agent', '')
        if SecurityManager.is_suspicious_user_agent(user_agent):
            SecurityManager.block_ip(client_ip, 30)  # Block for 30 minutes
            from app.utils.logging import log_action
            try:
                log_action('SUSPICIOUS_USER_AGENT', 'system', 
                          f"Suspicious user agent from {client_ip}: {user_agent}")
            except:
                pass  # Continue even if logging fails
            from flask import jsonify
            return jsonify({
                'error': 'Access denied',
                'code': 'SUSPICIOUS_ACTIVITY'
            }), 403
        
        # 4. Check for SQL injection attempts in request data
        request_data = None
        if request.is_json:
            try:
                request_data = request.get_json()
            except:
                pass
        elif request.form:
            request_data = dict(request.form)
        
        if request_data and SecurityManager.detect_sql_injection(request_data):
            SecurityManager.block_ip(client_ip, 60)  # Block for 1 hour
            from app.utils.logging import log_action
            try:
                log_action('SQL_INJECTION_ATTEMPT', 'system', 
                          f"SQL injection attempt from {client_ip}")
            except:
                pass  # Continue even if logging fails
            from flask import jsonify
            return jsonify({
                'error': 'Invalid request detected',
                'code': 'SECURITY_VIOLATION'
            }), 400
        
        # 5. Apply honeypot checks
        honeypot_result = check_honeypot_traps()
        if honeypot_result:
            return honeypot_result
        # if SecurityManager.check_rate_limit(client_ip):
        #     SecurityManager.block_ip(client_ip, 15)  # Block for 15 minutes
        #     from flask import jsonify
        #     return jsonify({
        #         'error': 'Too many requests. Please try again later.',
        #         'code': 'RATE_LIMITED'
        #     }), 429
        
        # # 3. Check for suspicious user agent
        # user_agent = request.headers.get('User-Agent', '')
        # if SecurityManager.is_suspicious_user_agent(user_agent):
        #     from app.utils.logging import log_action
        #     log_action('SUSPICIOUS_USER_AGENT', 'system', 
        #               f"Suspicious user agent from {client_ip}: {user_agent}")
        
        # # 4. Check for SQL injection attempts in request data
        # request_data = None
        # if request.is_json:
        #     try:
        #         request_data = request.get_json()
        #     except:
        #         pass
        # elif request.form:
        #     request_data = dict(request.form)
        
        # if request_data and SecurityManager.detect_sql_injection(request_data):
        #     SecurityManager.block_ip(client_ip, 60)  # Block for 1 hour
        #     from app.utils.logging import log_action
        #     log_action('SQL_INJECTION_ATTEMPT', 'system', 
        #               f"SQL injection attempt from {client_ip}")
        #     from flask import jsonify
        #     return jsonify({
        #         'error': 'Invalid request detected',
        #         'code': 'SECURITY_VIOLATION'
        #     }), 400        # 5. Apply honeypot checks
        honeypot_result = check_honeypot_traps()
        if honeypot_result:
            return honeypot_result
    
    @app.after_request
    def apply_security_headers(response):
        """Apply comprehensive security headers to all responses"""
        return add_security_headers(response)

    # Add security headers via Talisman (configured for development)
    csp = {
        'default-src': ["'self'", "http://localhost:3000", "http://127.0.0.1:3000"],
        'img-src': ["'self'", 'data:', 'https:', 'http:', "http://localhost:3000", "http://127.0.0.1:3000"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:3000", "http://127.0.0.1:3000"],
        'style-src': ["'self'", "'unsafe-inline'", "http://localhost:3000", "http://127.0.0.1:3000"],
        'connect-src': ["'self'", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
        'frame-ancestors': ["'self'", "http://localhost:3000", "http://127.0.0.1:3000"]
    }
    
    Talisman(app,
        force_https=False,  # Disable HTTPS requirement for local development
        session_cookie_secure=False,  # Allow cookies over HTTP for development
        session_cookie_http_only=True,
        strict_transport_security=False,  # Disable HSTS for development
        content_security_policy=csp,
        referrer_policy='strict-origin-when-cross-origin'
    )    # Additional security configurations (development-friendly)
    app.config.update({
        'SESSION_COOKIE_SECURE': False,  # Allow cookies over HTTP for development
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SAMESITE': 'Lax',
        'PERMANENT_SESSION_LIFETIME': timedelta(minutes=30)
    })

    # Route to serve files from upload directory
    @app.route('/uploads/<path:filename>')
    def serve_file(filename):
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        except Exception as e:
            return str(e), 404

   

    
    
    
    
    
     # Essential OAuth Configuration
    app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')
    app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET')
    app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    # Essential configuration
     # Essential configuration
    app.config.update({
        'SECRET_KEY': os.getenv('SECRET_KEY', secrets.token_hex(32)),
        'GOOGLE_CLIENT_ID': os.getenv('GOOGLE_CLIENT_ID'),
        'GOOGLE_CLIENT_SECRET': os.getenv('GOOGLE_CLIENT_SECRET'),        'FRONTEND_URL': os.getenv('FRONTEND_URL', 'http://localhost:3000'),
        'BASE_URL': os.getenv('BASE_URL', 'http://localhost:5000'),
    })
    
    app.config['DEBUG'] = True
    app.config['SQLALCHEMY_ECHO'] = True    # Initialiser les extensions
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "supports_credentials": True,
            "allow_headers": [
                "Content-Type", 
                "Authorization", 
                "X-Requested-With",
                "X-Content-Type-Options",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Cache-Control",
                "Pragma"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]
        },
        r"/socket.io/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"]
        }    })
    
    # Add custom CORS handler for preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            headers = response.headers
            headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
            headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH'
            headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Cache-Control, Pragma'
            headers['Access-Control-Allow-Credentials'] = 'true'
            headers['Access-Control-Max-Age'] = '86400'
            return response
    
   # Configure custom DNS resolver
  
    
   
   
    
    jwt = JWTManager(app)
    
    # Create custom session with retries
    custom_session = create_session_with_retries()
    
    jwt.init_app(app)
    mail.init_app(app)
    oauth.init_app(app) 
    
    # Initialize OAuth with proper config
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        access_token_url='https://oauth2.googleapis.com/token',
        authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
        api_base_url='https://www.googleapis.com/oauth2/v3/',
        client_kwargs={
            'scope': 'openid email profile',
            'redirect_uri': f"{app.config['BASE_URL']}/api/auth/login/google/callback",
            'timeout': 30,
            'verify': True
        }
    )
      # Enregistrer les blueprints
    from app.routes.auth import auth_bp
    #rom app.routes.files import files_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(files_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    from app.routes.collaborators import collaborators_bp
    from app.routes.active_users import active_users_bp
   #from app.routes.messages import messages_bp
    app.register_blueprint(collaborators_bp, url_prefix='/api/collaborators')
    app.register_blueprint(active_users_bp, url_prefix='/api/active_users')
   #app.register_blueprint(messages_bp, url_prefix='/api/messages')
    
    # Register scheduling blueprint
    from app.routes.scheduling import scheduling_bp
    app.register_blueprint(scheduling_bp, url_prefix='/api')
    
    return app
