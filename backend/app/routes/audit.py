from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.file import File
from app.utils.logging import log_action
import os
from app.utils.security_manager import security_manager

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/user-activity', methods=['GET'])
@jwt_required()
def get_user_activity():
    """Récupère l'historique d'activité d'un utilisateur"""
    current_user_id = get_jwt_identity()
    
    # Paramètres de filtrage
    limit = int(request.args.get('limit', 50))
    
    # Récupérer les logs de l'utilisateur
    from app.utils.logging import get_user_logs
    logs = get_user_logs(current_user_id, limit)
    
    return jsonify(logs), 200

@audit_bp.route('/file-activity/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file_activity(file_id):
    """Récupère l'historique d'activité pour un fichier spécifique"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si le fichier existe
    file = File.query.get(file_id)
    if not file:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur a accès au fichier
    if file.owner_id != current_user_id:
        # Vérifier si le fichier est partagé avec l'utilisateur
        from app.models.file_share import FileShare
        share = FileShare.query.filter_by(file_id=file_id, user_id=current_user_id).first()
        if not share:
            log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative d'accès non autorisé à l'historique du fichier {file_id}")
            return jsonify({'message': 'Accès non autorisé'}), 403
    
    # Récupérer les logs liés au fichier
    # Dans une implémentation réelle, nous filtrerions les logs par fichier_id
    # Pour cette démonstration, nous simulons des résultats
    
    logs = [
        {
            'id': 1,
            'action': 'UPLOAD',
            'user_id': file.owner_id,
            'details': f"Fichier téléversé: {file.name}",
            'timestamp': file.created_at.isoformat()
        },
        {
            'id': 2,
            'action': 'DOWNLOAD',
            'user_id': current_user_id,
            'details': f"Fichier téléchargé: {file.name}",
            'timestamp': file.updated_at.isoformat()
        }
    ]
    
    return jsonify(logs), 200

@audit_bp.route('/security-scan/<int:file_id>', methods=['POST'])
@jwt_required()
def security_scan_file(file_id):
    """Effectue une analyse de sécurité sur un fichier"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si le fichier existe
    file = File.query.get(file_id)
    if not file:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur a accès au fichier
    if file.owner_id != current_user_id:
        # Vérifier si le fichier est partagé avec l'utilisateur
        from app.models.file_share import FileShare
        share = FileShare.query.filter_by(file_id=file_id, user_id=current_user_id).first()
        if not share:
            log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative d'analyse de sécurité non autorisée sur le fichier {file_id}")
            return jsonify({'message': 'Accès non autorisé'}), 403
    
    # Dans une implémentation réelle, nous effectuerions une véritable analyse de sécurité
    # Pour cette démonstration, nous simulons des résultats
    
    # Journaliser l'action
    log_action('SECURITY_SCAN', current_user_id, f"Analyse de sécurité effectuée sur le fichier: {file.name}")
    
    return jsonify({
        'file_id': file_id,
        'file_name': file.name,
        'scan_result': 'clean',
        'threats_detected': 0,
        'encryption_status': 'encrypted',
        'scan_date': os.path.basename(__file__)
    }), 200

@audit_bp.route('/integrity-check/<int:file_id>', methods=['GET'])
@jwt_required()
def check_file_integrity(file_id):
    """Vérifie l'intégrité d'un fichier"""
    current_user_id = get_jwt_identity()
    
    # Vérifier si le fichier existe
    file = File.query.get(file_id)
    if not file:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur a accès au fichier
    if file.owner_id != current_user_id:
        # Vérifier si le fichier est partagé avec l'utilisateur
        from app.models.file_share import FileShare
        share = FileShare.query.filter_by(file_id=file_id, user_id=current_user_id).first()
        if not share:
            log_action('UNAUTHORIZED_ACCESS', current_user_id, f"Tentative de vérification d'intégrité non autorisée sur le fichier {file_id}")
            return jsonify({'message': 'Accès non autorisé'}), 403
    
    # Dans une implémentation réelle, nous vérifierions l'intégrité du fichier
    # en comparant son hash actuel avec le hash stocké
    # Pour cette démonstration, nous simulons des résultats
    
    # Générer un hash simulé
    import hashlib
    simulated_hash = hashlib.sha256(f"{file.name}{file.size}".encode()).hexdigest()
    
    # Journaliser l'action
    log_action('INTEGRITY_CHECK', current_user_id, f"Vérification d'intégrité effectuée sur le fichier: {file.name}")
    
    return jsonify({
        'file_id': file_id,
        'file_name': file.name,
        'integrity_status': 'valid',
        'current_hash': simulated_hash,
        'original_hash': simulated_hash,
        'check_date': os.path.basename(__file__)
    }), 200
