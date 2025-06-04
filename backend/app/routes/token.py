from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token
from app.models.user import User
from app.utils.logging import log_action
from datetime import datetime, timezone, timedelta

token_bp = Blueprint('token', __name__)

# Stockage en mémoire des tokens révoqués (dans un environnement de production, utiliser Redis ou une base de données)
revoked_tokens = set()

@token_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Vérifie si le token JWT est valide et rafraîchit si nécessaire"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si le token est dans la liste des tokens révoqués
    jwt_data = get_jwt()
    jti = jwt_data["jti"]
    
    if jti in revoked_tokens:
        return jsonify({"valid": False, "message": "Token révoqué"}), 401
    
    # Vérifier si l'utilisateur existe toujours
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"valid": False, "message": "Utilisateur non trouvé"}), 404
    
    # Vérifier si le token n'est pas expiré
    exp_timestamp = jwt_data["exp"]
    now = datetime.now(timezone.utc).timestamp()
    
    # Si le token va expirer bientôt (moins de 5 minutes), le rafraîchir
    if exp_timestamp - now < 300:  # 300 secondes = 5 minutes
        new_token = create_access_token(identity=current_user_id)
        return jsonify({
            "valid": True,
            "user_id": current_user_id,
            "access_token": new_token,
            "user": user.to_dict(),
            "expires_at": datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).isoformat()
        }), 200
    
    # Le token est valide
    return jsonify({
        "valid": True,
        "user_id": current_user_id,
        "user": user.to_dict(),
        "expires_at": datetime.fromtimestamp(exp_timestamp, tz=timezone.utc).isoformat()
    }), 200

@token_bp.route('/revoke', methods=['POST'])
@jwt_required()
def revoke_token():
    """Révoque le token JWT actuel"""
    current_user_id = get_jwt_identity()
    jwt_data = get_jwt()
    jti = jwt_data["jti"]
    
    # Ajouter le JTI à l'ensemble des tokens révoqués
    revoked_tokens.add(jti)
    
    # Journaliser l'action
    log_action('REVOKE_TOKEN', current_user_id, f"Token révoqué: {jti}")
    
    return jsonify({"message": "Token révoqué avec succès"}), 200

@token_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Rafraîchit le token JWT d'accès"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si le token de rafraîchissement est dans la liste des tokens révoqués
    jwt_data = get_jwt()
    jti = jwt_data["jti"]
    
    if jti in revoked_tokens:
        return jsonify({"message": "Token de rafraîchissement révoqué"}), 401
    
    # Créer un nouveau token d'accès
    access_token = create_access_token(identity=current_user_id)
    
    # Journaliser l'action
    log_action('REFRESH_TOKEN', current_user_id, f"Token rafraîchi")
    
    return jsonify({"access_token": access_token}), 200
