from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.file import File
from app.models.file_share import FileShare
from app.utils.logging import log_action
import json

collaboration_bp = Blueprint('collaboration', __name__)

@collaboration_bp.route('/share-file', methods=['POST'])
@jwt_required()
def share_file():
    """Partage un fichier avec un autre utilisateur"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not all(k in data for k in ('file_id', 'email')):
        return jsonify({'message': 'Données manquantes'}), 400
    
    file_id = data['file_id']
    email = data['email']
    
    # Vérifier si le fichier existe
    file = File.query.get(file_id)
    if not file:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur est le propriétaire du fichier
    if file.owner_id != current_user_id:
        log_action('UNAUTHORIZED_SHARE', current_user_id, f"Tentative de partage non autorisée du fichier {file_id}")
        return jsonify({'message': 'Vous n\'êtes pas autorisé à partager ce fichier'}), 403
    
    # Trouver l'utilisateur avec qui partager
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Vérifier si le fichier est déjà partagé avec cet utilisateur
    existing_share = FileShare.query.filter_by(file_id=file_id, user_id=user.id).first()
    if existing_share:
        return jsonify({'message': 'Le fichier est déjà partagé avec cet utilisateur'}), 409
    
    # Créer un nouveau partage
    new_share = FileShare(
        file_id=file_id,
        user_id=user.id
    )
    new_share.save()
    
    # Journaliser l'action
    log_action('SHARE_FILE', current_user_id, f"Fichier {file.name} partagé avec {user.email}")
    
    return jsonify({'message': 'Fichier partagé avec succès'}), 201

@collaboration_bp.route('/shared-with-me', methods=['GET'])
@jwt_required()
def get_shared_files():
    """Récupère les fichiers partagés avec l'utilisateur"""
    current_user_id = get_jwt_identity()
    
    # Récupérer les partages de l'utilisateur
    shares = FileShare.query.filter_by(user_id=current_user_id).all()
    
    # Récupérer les fichiers correspondants
    file_ids = [share.file_id for share in shares]
    files = File.query.filter(File.id.in_(file_ids)).all()
    
    # Récupérer les informations des propriétaires
    owner_ids = set(file.owner_id for file in files)
    owners = {user.id: user for user in User.query.filter(User.id.in_(owner_ids)).all()}
    
    # Formater les résultats
    result = []
    for file in files:
        owner = owners.get(file.owner_id)
        result.append({
            'id': file.id,
            'name': file.name,
            'size': file.size,
            'mime_type': file.mime_type,
            'owner': {
                'id': owner.id,
                'name': owner.name,
                'email': owner.email
            } if owner else None,
            'created_at': file.created_at.isoformat(),
            'updated_at': file.updated_at.isoformat()
        })
    
    return jsonify(result), 200

@collaboration_bp.route('/shared-by-me', methods=['GET'])
@jwt_required()
def get_my_shared_files():
    """Récupère les fichiers que l'utilisateur a partagés"""
    current_user_id = get_jwt_identity()
    
    # Récupérer les fichiers de l'utilisateur
    files = File.query.filter_by(owner_id=current_user_id).all()
    
    # Récupérer les partages pour ces fichiers
    file_ids = [file.id for file in files]
    shares = FileShare.query.filter(FileShare.file_id.in_(file_ids)).all()
    
    # Organiser les partages par fichier
    shares_by_file = {}
    for share in shares:
        if share.file_id not in shares_by_file:
            shares_by_file[share.file_id] = []
        shares_by_file[share.file_id].append(share.user_id)
    
    # Récupérer les informations des utilisateurs
    user_ids = set(user_id for user_ids in shares_by_file.values() for user_id in user_ids)
    users = {user.id: user for user in User.query.filter(User.id.in_(user_ids)).all()}
    
    # Formater les résultats
    result = []
    for file in files:
        if file.id in shares_by_file:
            shared_users = []
            for user_id in shares_by_file[file.id]:
                user = users.get(user_id)
                if user:
                    shared_users.append({
                        'id': user.id,
                        'name': user.name,
                        'email': user.email
                    })
            
            result.append({
                'id': file.id,
                'name': file.name,
                'size': file.size,
                'mime_type': file.mime_type,
                'shared_with': shared_users,
                'created_at': file.created_at.isoformat(),
                'updated_at': file.updated_at.isoformat()
            })
    
    return jsonify(result), 200

@collaboration_bp.route('/revoke-share', methods=['POST'])
@jwt_required()
def revoke_share():
    """Révoque le partage d'un fichier"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not all(k in data for k in ('file_id', 'user_id')):
        return jsonify({'message': 'Données manquantes'}), 400
    
    file_id = data['file_id']
    user_id = data['user_id']
    
    # Vérifier si le fichier existe
    file = File.query.get(file_id)
    if not file:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur est le propriétaire du fichier
    if file.owner_id != current_user_id:
        log_action('UNAUTHORIZED_REVOKE', current_user_id, f"Tentative de révocation non autorisée du partage du fichier {file_id}")
        return jsonify({'message': 'Vous n\'êtes pas autorisé à révoquer ce partage'}), 403
    
    # Vérifier si le partage existe
    share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
    if not share:
        return jsonify({'message': 'Partage non trouvé'}), 404
    
    # Supprimer le partage
    share.delete()
    
    # Journaliser l'action
    user = User.query.get(user_id)
    log_action('REVOKE_SHARE', current_user_id, f"Partage du fichier {file.name} révoqué pour {user.email if user else 'utilisateur inconnu'}")
    
    return jsonify({'message': 'Partage révoqué avec succès'}), 200



@collaboration_bp.route('/active_users', methods=['GET', 'OPTIONS'])
def get_active_users():
    if request.method == 'OPTIONS':
        return '', 200  # Réponse pour les requêtes préliminaires
    # Logique pour récupérer les utilisateurs actifs
    return jsonify({"active_users": []})

@collaboration_bp.route('/collaborators', methods=['GET', 'OPTIONS'])
def get_collaborators():
    if request.method == 'OPTIONS':
        return '', 200  # Réponse pour les requêtes préliminaires
    # Logique pour récupérer les collaborateurs
    return jsonify({"collaborators": []})