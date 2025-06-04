from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.file import File
from app.models.file_share import FileShare
from app.utils.logging import log_action, Log
import datetime

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Récupère la liste des utilisateurs (réservé aux administrateurs)"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si l'utilisateur est un administrateur (à implémenter)
    # Pour l'instant, nous simulons cette vérification
    is_admin = current_user_id == 1  # Supposons que l'utilisateur avec ID 1 est admin
    
    if not is_admin:
        log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative d'accès non autorisé à la liste des utilisateurs")
        return jsonify({"message": "Accès non autorisé"}), 403
    
    # Récupérer tous les utilisateurs
    users = User.query.all()
    
    # Formater les résultats
    result = [user.to_dict() for user in users]
    
    log_action('ADMIN_LIST_USERS', current_user_id, f"Liste des utilisateurs consultée")
    
    return jsonify(result), 200

@admin_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    """Récupère les logs système (réservé aux administrateurs)"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si l'utilisateur est un administrateur
    is_admin = current_user_id == 1  # Simulation
    
    if not is_admin:
        log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative d'accès non autorisé aux logs système")
        return jsonify({"message": "Accès non autorisé"}), 403
    
    # Paramètres de filtrage
    action_type = request.args.get('action')
    user_id = request.args.get('user_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = int(request.args.get('limit', 100))
    
    # Construire la requête
    query = Log.query
    
    if action_type:
        query = query.filter(Log.action == action_type)
    
    if user_id:
        query = query.filter(Log.user_id == int(user_id))
    
    if start_date:
        start_datetime = datetime.datetime.fromisoformat(start_date)
        query = query.filter(Log.timestamp >= start_datetime)
    
    if end_date:
        end_datetime = datetime.datetime.fromisoformat(end_date)
        query = query.filter(Log.timestamp <= end_datetime)
    
    # Exécuter la requête
    logs = query.order_by(Log.timestamp.desc()).limit(limit).all()
    
    # Formater les résultats
    result = [log.to_dict() for log in logs]
    
    log_action('ADMIN_VIEW_LOGS', current_user_id, f"Logs système consultés")
    
    return jsonify(result), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Récupère les statistiques du système (réservé aux administrateurs)"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si l'utilisateur est un administrateur
    is_admin = current_user_id == 1  # Simulation
    
    if not is_admin:
        log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative d'accès non autorisé aux statistiques système")
        return jsonify({"message": "Accès non autorisé"}), 403
    
    # Calculer les statistiques
    total_users = User.query.count()
    total_files = File.query.count()
    total_shares = FileShare.query.count()
    
    # Statistiques des actions
    login_count = Log.query.filter_by(action='LOGIN').count()
    upload_count = Log.query.filter_by(action='UPLOAD').count()
    download_count = Log.query.filter_by(action='DOWNLOAD').count()
    
    # Formater les résultats
    result = {
        "users": {
            "total": total_users
        },
        "files": {
            "total": total_files,
            "shared": total_shares
        },
        "actions": {
            "logins": login_count,
            "uploads": upload_count,
            "downloads": download_count
        }
    }
    
    log_action('ADMIN_VIEW_STATS', current_user_id, f"Statistiques système consultées")
    
    return jsonify(result), 200
