from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from app.models.file import File
from app.models.user import User
from app.models.file_share import FileShare
from app.utils.storage import upload_file, download_file, delete_file
from app.utils.encryption import encrypt_file, decrypt_file
from app.config.config import Config
from app.utils.logging import log_action

files_bp = Blueprint('files', __name__)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@files_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload():
    current_user_id = get_jwt_identity()
    
    # Vérifier si le fichier est présent dans la requête
    if 'file' not in request.files:
        return jsonify({'message': 'Aucun fichier trouvé'}), 400
    
    file = request.files['file']
    
    # Vérifier si un fichier a été sélectionné
    if file.filename == '':
        return jsonify({'message': 'Aucun fichier sélectionné'}), 400
    
    # Vérifier si le fichier est d'un type autorisé
    if not allowed_file(file.filename):
        return jsonify({'message': 'Type de fichier non autorisé'}), 400
    
    # Sécuriser le nom du fichier
    filename = secure_filename(file.filename)
    
    # Créer le répertoire d'upload s'il n'existe pas
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    
    # Chemin temporaire pour le fichier
    temp_path = os.path.join(Config.UPLOAD_FOLDER, filename)
    
    # Sauvegarder le fichier temporairement
    file.save(temp_path)
    
    try:
        # Chiffrer le fichier
        encrypted_path = encrypt_file(temp_path)
        
        # Téléverser le fichier chiffré vers GCP Storage
        storage_path = upload_file(encrypted_path, current_user_id)
        
        # Créer une entrée dans la base de données
        new_file = File(
            name=filename,
            storage_path=storage_path,
            size=os.path.getsize(encrypted_path),
            mime_type=file.content_type,
            owner_id=current_user_id
        )
        new_file.save()
        
        # Journaliser l'action
        log_action('UPLOAD', current_user_id, f"Fichier téléversé: {filename}")
        
        # Nettoyer les fichiers temporaires
        os.remove(temp_path)
        os.remove(encrypted_path)
        
        return jsonify({
            'message': 'Fichier téléversé avec succès',
            'file': {
                'id': new_file.id,
                'name': new_file.name,
                'size': new_file.size,
                'uploaded_at': new_file.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        # Nettoyer en cas d'erreur
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({'message': f'Erreur lors du téléversement: {str(e)}'}), 500

@files_bp.route('/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download(file_id):
    current_user_id = get_jwt_identity()
    
    # Récupérer le fichier depuis la base de données
    file_record = File.query.get(file_id)
    
    if not file_record:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur a le droit d'accéder au fichier
    if file_record.owner_id != current_user_id:
        # Vérifier si le fichier est partagé avec l'utilisateur
        share = FileShare.query.filter_by(file_id=file_id, user_id=current_user_id).first()
        if not share:
            return jsonify({'message': 'Accès non autorisé'}), 403
    
    try:
        # Créer le répertoire temporaire s'il n'existe pas
        temp_dir = os.path.join(Config.UPLOAD_FOLDER, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Télécharger le fichier chiffré depuis GCP Storage
        encrypted_path = download_file(file_record.storage_path, temp_dir)
        
        # Déchiffrer le fichier
        decrypted_path = decrypt_file(encrypted_path)
        
        # Journaliser l'action
        log_action('DOWNLOAD', current_user_id, f"Fichier téléchargé: {file_record.name}")
        
        # Envoyer le fichier déchiffré
        return send_file(
            decrypted_path,
            as_attachment=True,
            download_name=file_record.name,
            mimetype=file_record.mime_type
        )
        
    except Exception as e:
        return jsonify({'message': f'Erreur lors du téléchargement: {str(e)}'}), 500

@files_bp.route('/share', methods=['POST'])
@jwt_required()
def share_file():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier si les données requises sont présentes
    if not all(k in data for k in ('file_id', 'email')):
        return jsonify({'message': 'Données manquantes'}), 400
    
    file_id = data['file_id']
    email = data['email']
    
    # Récupérer le fichier depuis la base de données
    file_record = File.query.get(file_id)
    
    if not file_record:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur est le propriétaire du fichier
    if file_record.owner_id != current_user_id:
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
    log_action('SHARE', current_user_id, f"Fichier partagé: {file_record.name} avec {user.email}")
    
    return jsonify({'message': 'Fichier partagé avec succès'}), 201

@files_bp.route('/list', methods=['GET'])
@jwt_required()
def list_files():
    current_user_id = get_jwt_identity()
    
    # Récupérer les fichiers de l'utilisateur
    owned_files = File.query.filter_by(owner_id=current_user_id).all()
    
    # Récupérer les fichiers partagés avec l'utilisateur
    shared_files_ids = [share.file_id for share in FileShare.query.filter_by(user_id=current_user_id).all()]
    shared_files = File.query.filter(File.id.in_(shared_files_ids)).all()
    
    # Formater les résultats
    result = {
        'owned': [file.to_dict() for file in owned_files],
        'shared': [file.to_dict() for file in shared_files]
    }
    
    return jsonify(result), 200

@files_bp.route('/delete/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete(file_id):
    current_user_id = get_jwt_identity()
    
    # Récupérer le fichier depuis la base de données
    file_record = File.query.get(file_id)
    
    if not file_record:
        return jsonify({'message': 'Fichier non trouvé'}), 404
    
    # Vérifier si l'utilisateur est le propriétaire du fichier
    if file_record.owner_id != current_user_id:
        return jsonify({'message': 'Vous n\'êtes pas autorisé à supprimer ce fichier'}), 403
    
    try:
        # Supprimer le fichier de GCP Storage
        delete_file(file_record.storage_path)
        
        # Supprimer les partages associés
        FileShare.query.filter_by(file_id=file_id).delete()
        
        # Supprimer l'entrée de la base de données
        file_record.delete()
        
        # Journaliser l'action
        log_action('DELETE', current_user_id, f"Fichier supprimé: {file_record.name}")
        
        return jsonify({'message': 'Fichier supprimé avec succès'}), 200
        
    except Exception as e:
        return jsonify({'message': f'Erreur lors de la suppression: {str(e)}'}), 500



