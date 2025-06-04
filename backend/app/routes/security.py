from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.utils.logging import log_action
import re

security_bp = Blueprint('security', __name__)

# Expressions régulières pour la validation
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PASSWORD_REGEX = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')

@security_bp.route('/password-policy', methods=['GET'])
def password_policy():
    """Retourne la politique de mot de passe de l'application"""
    return jsonify({
        "min_length": 8,
        "requires_uppercase": True,
        "requires_lowercase": True,
        "requires_digit": True,
        "requires_special_char": True,
        "special_chars": "@$!%*?&",
        "description": "Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial."
    }), 200

@security_bp.route('/validate-password', methods=['POST'])
def validate_password():
    """Valide un mot de passe selon la politique de sécurité"""
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({"valid": False, "message": "Mot de passe manquant"}), 400
    
    password = data['password']
    
    # Vérifier la conformité avec la politique de mot de passe
    if not PASSWORD_REGEX.match(password):
        return jsonify({
            "valid": False,
            "message": "Le mot de passe ne respecte pas la politique de sécurité",
            "details": "Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial."
        }), 200
    
    return jsonify({"valid": True, "message": "Mot de passe valide"}), 200

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
    
    # Vérifier si le nouveau mot de passe respecte la politique
    if not PASSWORD_REGEX.match(data['new_password']):
        return jsonify({
            'message': 'Le nouveau mot de passe ne respecte pas la politique de sécurité',
            'details': 'Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule, un chiffre et un caractère spécial.'
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
