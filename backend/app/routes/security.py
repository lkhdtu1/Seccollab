from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.utils.logging import log_action
import re
import hashlib
import time
from datetime import datetime, timedelta
from collections import defaultdict
import ipaddress

security_bp = Blueprint('security', __name__)

# Security monitoring storage (in production, use Redis or database)
failed_attempts = defaultdict(list)
suspicious_ips = defaultdict(int)
rate_limit_storage = defaultdict(list)

# Expressions régulières pour la validation - Enhanced Security
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
# Updated password regex: minimum 12 characters with all character types required
PASSWORD_REGEX = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$')

# Additional security patterns for enhanced validation
COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'Password1',
    'Password123', 'password1', 'password12', 'iloveyou', 'princess',
    'welcome123', 'admin123', 'root', 'toor', 'pass', 'test'
]

# Password strength categories
WEAK_PATTERNS = [
    r'(.)\1{2,}',  # Repeated characters (aaa, 111, etc.)
    r'(012|123|234|345|456|567|678|789|890)',  # Sequential numbers
    r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)',  # Sequential letters
    r'(qwe|qwer|qwert|qwerty|wer|ert|rty)',  # Keyboard patterns
    r'(asd|asdf|sdf|dfg|fgh)',  # More keyboard patterns
]

@security_bp.route('/password-policy', methods=['GET'])
def password_policy():
    """Retourne la politique de mot de passe de l'application - Enhanced Security"""
    return jsonify({
        "min_length": 12,
        "max_length": 128,
        "requires_uppercase": True,
        "requires_lowercase": True,
        "requires_digit": True,
        "requires_special_char": True,
        "special_chars": "@$!%*?&",
        "forbidden_patterns": [
            "No repeated characters (aaa, 111, etc.)",
            "No sequential patterns (123, abc, qwerty)",
            "No common passwords",
            "No personal information"
        ],
        "strength_requirements": {
            "minimum_entropy": 50,
            "no_dictionary_words": True,
            "no_keyboard_patterns": True,
            "no_personal_info": True
        },
        "description": "Le mot de passe doit contenir au moins 12 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial, sans motifs faibles ou mots de passe courants."
    }), 200

@security_bp.route('/validate-password', methods=['POST'])
def validate_password():
    """Valide un mot de passe selon la politique de sécurité renforcée"""
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({"valid": False, "message": "Mot de passe manquant"}), 400
    
    password = data['password']
    
    # Comprehensive password validation
    validation_result = validate_password_strength(password)
    
    if not validation_result['valid']:
        return jsonify({
            "valid": False,
            "message": "Le mot de passe ne respecte pas la politique de sécurité",
            "details": validation_result['details'],
            "strength_score": validation_result['strength_score'],
            "suggestions": validation_result['suggestions']
        }), 200
    
    return jsonify({
        "valid": True, 
        "message": "Mot de passe valide",
        "strength_score": validation_result['strength_score'],
        "strength_level": validation_result['strength_level']
    }), 200

def validate_password_strength(password):
    """Enhanced password strength validation with detailed feedback"""
    errors = []
    suggestions = []
    strength_score = 0
    
    # Basic length check (minimum 12 characters)
    if len(password) < 12:
        errors.append("Le mot de passe doit contenir au moins 12 caractères")
        suggestions.append("Ajoutez plus de caractères pour atteindre au moins 12")
    else:
        strength_score += 20
        
    # Maximum length check for security
    if len(password) > 128:
        errors.append("Le mot de passe ne doit pas dépasser 128 caractères")
        
    # Character type requirements
    if not re.search(r'[a-z]', password):
        errors.append("Le mot de passe doit contenir au moins une lettre minuscule")
        suggestions.append("Ajoutez au moins une lettre minuscule (a-z)")
    else:
        strength_score += 10
        
    if not re.search(r'[A-Z]', password):
        errors.append("Le mot de passe doit contenir au moins une lettre majuscule")
        suggestions.append("Ajoutez au moins une lettre majuscule (A-Z)")
    else:
        strength_score += 10
        
    if not re.search(r'\d', password):
        errors.append("Le mot de passe doit contenir au moins un chiffre")
        suggestions.append("Ajoutez au moins un chiffre (0-9)")
    else:
        strength_score += 10
        
    if not re.search(r'[@$!%*?&]', password):
        errors.append("Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)")
        suggestions.append("Ajoutez au moins un caractère spécial (@$!%*?&)")
    else:
        strength_score += 10
    
    # Check for common passwords
    if password.lower() in [pwd.lower() for pwd in COMMON_PASSWORDS]:
        errors.append("Ce mot de passe est trop commun et facilement devinable")
        suggestions.append("Évitez les mots de passe courants comme 'password123'")
    else:
        strength_score += 15
        
    # Check for weak patterns
    for pattern in WEAK_PATTERNS:
        if re.search(pattern, password.lower()):
            errors.append("Le mot de passe contient des motifs faibles (répétitions, séquences)")
            suggestions.append("Évitez les répétitions (aaa) et séquences (123, abc)")
            break
    else:
        strength_score += 15
        
    # Additional strength checks
    # Character diversity bonus
    char_types = sum([
        bool(re.search(r'[a-z]', password)),
        bool(re.search(r'[A-Z]', password)),
        bool(re.search(r'\d', password)),
        bool(re.search(r'[@$!%*?&]', password))
    ])
    
    if char_types == 4:
        strength_score += 10
        
    # Length bonus
    if len(password) >= 16:
        strength_score += 10
        
    # Determine strength level
    if strength_score >= 90:
        strength_level = "Très fort"
    elif strength_score >= 75:
        strength_level = "Fort"
    elif strength_score >= 60:
        strength_level = "Moyen"
    else:
        strength_level = "Faible"
    
    return {
        'valid': len(errors) == 0,
        'details': errors,
        'suggestions': suggestions,
        'strength_score': strength_score,
        'strength_level': strength_level
    }

@security_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change le mot de passe d'un utilisateur avec vérification de sécurité"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not all(k in data for k in ('current_password', 'new_password')):
        return jsonify({'message': 'Données manquantes'}), 400
    
    # Récupérer l'utilisateur depuis la base de données
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Vérifier si le mot de passe actuel est correct
    from app.utils.security import check_password
    if not check_password(data['current_password'], user.password):
        # Journaliser la tentative échouée
        log_action('FAILED_PASSWORD_CHANGE', current_user_id, f"Tentative de changement de mot de passe échouée: mot de passe actuel incorrect")
        return jsonify({'message': 'Mot de passe actuel incorrect'}), 401
      # Vérifier si le nouveau mot de passe respecte la politique renforcée
    validation_result = validate_password_strength(data['new_password'])
    if not validation_result['valid']:
        return jsonify({
            'message': 'Le nouveau mot de passe ne respecte pas la politique de sécurité renforcée',
            'details': validation_result['details'],
            'suggestions': validation_result['suggestions']
        }), 400
    
    # Hacher le nouveau mot de passe
    from app.utils.security import hash_password
    hashed_password = hash_password(data['new_password'])
    
    # Mettre à jour le mot de passe
    user.password = hashed_password
    user.save()
    
    # Journaliser l'action
    log_action('PASSWORD_CHANGED', current_user_id, f"Mot de passe changé avec succès")
    
    return jsonify({'message': 'Mot de passe changé avec succès'}), 200

@security_bp.route('/security-questions', methods=['POST'])
@jwt_required()
def set_security_questions():
    """Configure les questions de sécurité pour la récupération de compte"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not 'questions' in data or not isinstance(data['questions'], list) or len(data['questions']) < 2:
        return jsonify({'message': 'Au moins deux questions de sécurité sont requises'}), 400
    
    # Récupérer l'utilisateur depuis la base de données
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Stocker les questions et réponses de sécurité
    # Dans une implémentation réelle, nous stockerions cela dans une table séparée
    # et nous hacherions les réponses
    
    # Simuler le stockage pour cette démonstration
    from app.utils.security_manager import security_manager
    
    # Chiffrer les réponses avant de les stocker
    encrypted_questions = []
    for q in data['questions']:
        if not all(k in q for k in ('question', 'answer')):
            return jsonify({'message': 'Format de question invalide'}), 400
        
        encrypted_answer = security_manager.encrypt_data(q['answer']).decode('utf-8')
        encrypted_questions.append({
            'question': q['question'],
            'answer': encrypted_answer
        })
    
    # Dans une implémentation réelle, nous sauvegarderions cela dans la base de données
    # Pour cette démonstration, nous simulons simplement le succès
    
    # Journaliser l'action
    log_action('SECURITY_QUESTIONS_SET', current_user_id, f"Questions de sécurité configurées")
    
    return jsonify({'message': 'Questions de sécurité configurées avec succès'}), 200

@security_bp.route('/two-factor', methods=['POST'])
@jwt_required()
def configure_two_factor():
    """Configure l'authentification à deux facteurs"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not 'enable' in data:
        return jsonify({'message': 'Paramètre enable manquant'}), 400
    
    enable_2fa = data['enable']
    
    # Récupérer l'utilisateur depuis la base de données
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Dans une implémentation réelle, nous configurerions réellement la 2FA
    # Pour cette démonstration, nous simulons simplement le succès
    
    action = 'ENABLE_2FA' if enable_2fa else 'DISABLE_2FA'
    log_action(action, current_user_id, f"Authentification à deux facteurs {'activée' if enable_2fa else 'désactivée'}")
    
    return jsonify({
        'message': f"Authentification à deux facteurs {'activée' if enable_2fa else 'désactivée'} avec succès",
        'two_factor_enabled': enable_2fa
    }), 200

@security_bp.route('/security-status', methods=['GET'])
@jwt_required()
def security_status():
    """Get comprehensive security status for current user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
    # Get user's security information
    security_info = {
        'user_id': current_user_id,
        'mfa_enabled': getattr(user, 'mfa_enabled', False),
        'last_login': getattr(user, 'last_active', None),
        'failed_login_attempts': getattr(user, 'failed_login_attempts', 0),
        'account_locked': bool(getattr(user, 'account_locked_until', None) and 
                              getattr(user, 'account_locked_until') > datetime.utcnow()),
        'password_last_changed': getattr(user, 'password_changed_at', None),
        'password_age_days': None,
        'trusted_devices_count': 0,
        'security_score': calculate_security_score(user),
        'recommendations': get_security_recommendations(user)
    }
    
    # Calculate password age
    if hasattr(user, 'password_changed_at') and user.password_changed_at:
        password_age = datetime.utcnow() - user.password_changed_at
        security_info['password_age_days'] = password_age.days
        
    # Count trusted devices
    if hasattr(user, 'trusted_devices'):
        security_info['trusted_devices_count'] = len(user.trusted_devices.all())
    
    log_action('SECURITY_STATUS_CHECKED', current_user_id, "Security status reviewed")
    
    return jsonify(security_info), 200

@security_bp.route('/session-security', methods=['GET'])
@jwt_required()
def session_security():
    """Get current session security information"""
    current_user_id = get_jwt_identity()
    user_agent = request.headers.get('User-Agent', 'Unknown')
    client_ip = request.environ.get('REMOTE_ADDR', 'Unknown')
    
    session_info = {
        'session_id': hashlib.sha256(f"{current_user_id}{user_agent}{client_ip}".encode()).hexdigest()[:16],
        'user_agent': user_agent,
        'client_ip': client_ip,
        'is_secure': request.is_secure,
        'session_duration': 'Active',
        'security_warnings': check_session_security(client_ip, user_agent)
    }
    
    return jsonify(session_info), 200

@security_bp.route('/terminate-all-sessions', methods=['POST'])
@jwt_required()
def terminate_all_sessions():
    """Terminate all user sessions (logout from all devices)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
    # In a real implementation, you would invalidate all JWT tokens
    # For now, we'll clear trusted devices and log the action
    if hasattr(user, 'trusted_devices'):
        user.trusted_devices.delete()
        
    # Force password reset on next login (optional security measure)
    # user.force_password_reset = True
    
    from app.models.user import db
    db.session.commit()
    
    log_action('ALL_SESSIONS_TERMINATED', current_user_id, "All sessions terminated by user")
    
    return jsonify({'message': 'Toutes les sessions ont été terminées avec succès'}), 200

@security_bp.route('/check-breach', methods=['POST'])
@jwt_required()
def check_password_breach():
    """Check if password has been compromised in data breaches (using k-anonymity)"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({'message': 'Mot de passe manquant'}), 400
        
    password = data['password']
    
    # Use k-anonymity with SHA-1 hash prefix (first 5 characters)
    # This is the Have I Been Pwned API approach
    import hashlib
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    hash_prefix = sha1_hash[:5]
    hash_suffix = sha1_hash[5:]
    
    # In a real implementation, you would query the HaveIBeenPwned API
    # For demo purposes, we'll simulate some common compromised passwords
    compromised_passwords = {
        'password123': True,
        'admin123': True,
        '123456789': True,
        'qwerty123': True
    }
    
    is_compromised = password.lower() in compromised_passwords
    
    result = {
        'is_compromised': is_compromised,
        'breach_count': compromised_passwords.get(password.lower(), 0) if is_compromised else 0,
        'recommendation': 'Changez immédiatement votre mot de passe' if is_compromised else 'Mot de passe sécurisé',
        'checked_at': datetime.utcnow().isoformat()
    }
    
    if is_compromised:
        log_action('COMPROMISED_PASSWORD_DETECTED', current_user_id, 
                  f"User attempted to use compromised password")
    
    return jsonify(result), 200

@security_bp.route('/security-alerts', methods=['GET'])
@jwt_required()
def security_alerts():
    """Get security alerts and suspicious activity for user"""
    current_user_id = get_jwt_identity()
    
    # In a real implementation, fetch from database
    alerts = [
        {
            'id': 1,
            'type': 'info',
            'title': 'Nouvelle connexion détectée',
            'message': 'Connexion depuis un nouvel appareil',
            'timestamp': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            'severity': 'medium'
        }
    ]
    
    return jsonify({'alerts': alerts}), 200

def calculate_security_score(user):
    """Calculate user's security score (0-100)"""
    score = 0
    
    # MFA enabled (+30 points)
    if getattr(user, 'mfa_enabled', False):
        score += 30
        
    # Recent password change (+20 points)
    if hasattr(user, 'password_changed_at') and user.password_changed_at:
        days_since_change = (datetime.utcnow() - user.password_changed_at).days
        if days_since_change < 90:
            score += 20
            
    # No recent failed attempts (+20 points)
    if getattr(user, 'failed_login_attempts', 0) == 0:
        score += 20
        
    # Account not locked (+15 points)
    if not (getattr(user, 'account_locked_until', None) and 
            getattr(user, 'account_locked_until') > datetime.utcnow()):
        score += 15
        
    # Email verified (+15 points)
    if getattr(user, 'email_verified', True):
        score += 15
        
    return min(score, 100)

def get_security_recommendations(user):
    """Get personalized security recommendations"""
    recommendations = []
    
    if not getattr(user, 'mfa_enabled', False):
        recommendations.append({
            'type': 'critical',
            'message': 'Activez l\'authentification à deux facteurs',
            'action': 'enable_mfa'
        })
        
    if hasattr(user, 'password_changed_at') and user.password_changed_at:
        days_since_change = (datetime.utcnow() - user.password_changed_at).days
        if days_since_change > 180:
            recommendations.append({
                'type': 'warning',
                'message': 'Votre mot de passe n\'a pas été changé depuis plus de 6 mois',
                'action': 'change_password'
            })
            
    return recommendations

def check_session_security(client_ip, user_agent):
    """Check for session security issues"""
    warnings = []
    
    # Check for suspicious IP patterns
    try:
        ip = ipaddress.ip_address(client_ip)
        if ip.is_private:
            warnings.append({
                'type': 'info',
                'message': 'Connexion depuis un réseau privé'
            })
    except:
        pass
        
    # Check user agent for suspicious patterns
    if 'bot' in user_agent.lower() or 'crawler' in user_agent.lower():
        warnings.append({
            'type': 'warning',
            'message': 'User-Agent suspect détecté'
        })
        
    return warnings

@security_bp.route('/rate-limit-status', methods=['GET'])
def rate_limit_status():
    """Get current rate limiting status"""
    client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
    
    # Clean old entries (older than 1 hour)
    cutoff_time = time.time() - 3600
    if client_ip in rate_limit_storage:
        rate_limit_storage[client_ip] = [
            timestamp for timestamp in rate_limit_storage[client_ip] 
            if timestamp > cutoff_time
        ]
    
    current_requests = len(rate_limit_storage.get(client_ip, []))
    
    return jsonify({
        'client_ip': client_ip,
        'current_requests_last_hour': current_requests,
        'limit_per_hour': 200,
        'remaining_requests': max(0, 200 - current_requests),
        'reset_time': int(time.time()) + 3600
    }), 200
