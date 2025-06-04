from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.utils.logging import log_action

from app.utils.database import db

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    
    # Récupérer l'utilisateur depuis la base de données
    if not (user := User.query.get(current_user_id)):
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    else:
        return jsonify({
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'created_at': user.created_at.isoformat()
        }), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Récupérer l'utilisateur depuis la base de données
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Mettre à jour les informations de l'utilisateur
    if 'name' in data:
        user.name = data['name']
    '''
    # Mettre à jour l'email (avec vérification)
    if 'email' in data and data['email'] != user.email:
        # Vérifier si l'email est déjà utilisé
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': 'Cet email est déjà utilisé'}), 409
        
        user.email = data['email']
    '''
    # Sauvegarder les modifications
    user.save()
    
    # Journaliser l'action
    log_action('UPDATE_PROFILE', current_user_id, f"Profil mis à jour: {user.email}")
    
    return jsonify({
        'message': 'Profil mis à jour avec succès',
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name
        }
    }), 200

@users_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
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
        return jsonify({'message': 'Mot de passe actuel incorrect'}), 401
    
    # Hacher le nouveau mot de passe
    from app.utils.security import hash_password
    hashed_password = hash_password(data['new_password'])
    
    # Mettre à jour le mot de passe
    user.password = hashed_password
    user.save()
    
    # Journaliser l'action
    log_action('CHANGE_PASSWORD', current_user_id, f"Mot de passe changé: {user.email}")
    
    return jsonify({'message': 'Mot de passe changé avec succès'}), 200

@users_bp.route('/status', methods=['POST'])
@jwt_required()
def update_status():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({"msg": "Statut requis"}), 400

    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    user.status = new_status
    db.session.commit()

    return jsonify({"msg": f"Statut mis à jour à {new_status}"}), 200