"""File handling routes for the application."""
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import db,User
from    app.models.file import File , Activity, Message
from    app. models.file_share import FileShare
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from google.cloud import storage
import mimetypes
from app.config.config import Config
from app.utils.logging import log_action
from app.utils.encryption import encrypt_file, decrypt_file
from app.utils.storage import upload_file, download_file, delete_file
files_bp = Blueprint('files', __name__)

def allowed_file(filename):
    """Check if file type is allowed."""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@files_bp.route('/files', methods=['GET'])
@jwt_required()
def list_files():
    """List all files accessible to the user."""
    user_id = get_jwt_identity()
    
    # Get user's own files
    own_files = File.query.filter_by(owner_id=user_id).all()
    
    # Get files shared with the user
    shared_files = File.query.join(FileShare).filter(FileShare.user_id == user_id).all()
    
    # Combine and format the results
    all_files = []
    for file in own_files + shared_files:
        file_dict = file.to_dict()
        # Add sharing status
        file_dict['is_owner'] = file.owner_id == user_id
        if not file_dict['is_owner']:
            share = FileShare.query.filter_by(file_id=file.id, user_id=user_id).first()
            file_dict['permission'] = share.permission if share else 'read'
        all_files.append(file_dict)
    
    return jsonify({'files': all_files})

@files_bp.route('/files/upload', methods=['POST'])
@jwt_required()
def upload():
    """Upload a new file."""
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        filename = secure_filename(file.filename)
        temp_path = None
        encrypted_path = None
        
        # Create upload directory if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        
        # Save file temporarily
        temp_path = os.path.join(Config.UPLOAD_FOLDER, f"temp_{filename}")
        file.save(temp_path)
        
        # Encrypt file
        encrypted_path = encrypt_file(temp_path)
        
        # Upload encrypted file to storage
        storage_path = upload_file(encrypted_path, current_user_id)
        
        # Create and commit file record first
        new_file = File(
            name=filename,
            storage_path=storage_path,
            size=int(os.path.getsize(encrypted_path)),
            mime_type=file.mimetype,
            owner_id=int(current_user_id)
        )
        db.session.add(new_file)
        db.session.commit()  # Commit to get the file id
        
        # Now create and commit the activity record
        activity = Activity(
            type='upload',
            file_id=new_file.id,  # Now we have the file id
            user_id=int(current_user_id)
        )
        db.session.add(activity)
        db.session.commit()
        
        # Log action
        log_action('UPLOAD', current_user_id, f"File uploaded: {filename}")
        
        return jsonify({'file': new_file.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {str(e)}")
        return jsonify({'error': 'File upload failed', 'details': str(e)}), 500
        
    finally:
        # Clean up temporary files
        try:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            if encrypted_path and os.path.exists(encrypted_path):
                os.remove(encrypted_path)
        except Exception as e:
            print(f"Cleanup error: {str(e)}")


@files_bp.route('/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Delete a file."""
    try:
        current_user_id = int(get_jwt_identity())
        file = File.query.get_or_404(file_id)

        # Check if user owns the file or has admin permission
        if file.owner_id != current_user_id:
            share = FileShare.query.filter_by(file_id=file_id, user_id=current_user_id).first()
            if not share or share.permission != 'write':
                return jsonify({'error': 'Permission denied - must be file owner'}), 403

        # Delete file from storage if it exists
        if file.storage_path and os.path.exists(file.storage_path):
            os.remove(file.storage_path)

        # Log the action before deleting
        file_name = file.name
        
        # Delete the file - cascade will handle related records
        db.session.delete(file)
        db.session.commit()

        # Log after successful deletion
        log_action('DELETE_FILE', current_user_id, f'Deleted file: {file_name}')

        return jsonify({'message': 'File deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting file: {str(e)}")
        return jsonify({'error': 'Failed to delete file'}), 500
    
@files_bp.route('/files/<file_id>/download', methods=['GET'])
@jwt_required()
def download(file_id):
    """Download a file."""
    user_id = int(get_jwt_identity())
    file = File.query.get_or_404(file_id)
    
    
    
    # Check permissions
    if file.owner_id != user_id:
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Permission denied'}), 403
    
    try:
        # Download from Google Cloud Storage
       #bucket = current_app.extensions['storage_bucket']
       #blob = bucket.blob(file.storage_path)
        
        
        # Créer le répertoire temporaire s'il n'existe pas
        temp_dir = os.path.join(Config.UPLOAD_FOLDER, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Télécharger le fichier chiffré depuis GCP Storage
        encrypted_path = download_file(file.storage_path, temp_dir)
        
        # Déchiffrer le fichier
        decrypted_path = decrypt_file(encrypted_path)
        
        # Journaliser l'action
        log_action('DOWNLOAD', user_id, f"Fichier téléchargé: {file.name}")
        
        
        
        
        # Create temporary file
       #temp_path = f"/tmp/{file.name}"
        #blob.download_to_filename(temp_path)

        
        # Create activity record
        activity = Activity(
            type='download',
            file_id=file_id,
            user_id=user_id
        )
        db.session.add(activity)
        db.session.commit()
        
        
        
        return send_file(
            decrypted_path,
            as_attachment=True,
            download_name=file.name,
            mimetype=file.mime_type
        )
        
    except Exception as e:
        return jsonify({'message': f'Erreur lors du téléchargement: {str(e)}'}), 500

@files_bp.route('/files/<file_id>/share', methods=['POST'])
@jwt_required()
def share_file(file_id):
    """Share a file with another user."""
    user_id = int(get_jwt_identity())

    file = File.query.get_or_404(file_id)
    
    # Check ownership
    # Check ownership or write-permission
    if file.owner_id != user_id:
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share or share.permission != 'write':
            return jsonify({'error': 'Only the owner or users with write access can share this file'}), 403

    
    data = request.get_json()
    email = data.get('email')
    permission = data.get('permission', 'read')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if permission not in ['read', 'write']:
        return jsonify({'error': 'Invalid permission level'}), 400
    
    # Find user to share with
    share_user = User.query.filter_by(email=email).first()
    if not share_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if already shared
    
    existing_share = FileShare.query.filter_by(
        file_id=file_id,
        user_id=share_user.id
    ).first()
    
    
    try:
        if existing_share:
            existing_share.permission = permission
        else:
            new_share = FileShare(
                file_id=file_id,
                user_id=share_user.id,
                permission=permission
            )
            db.session.add(new_share)
        
        # Create activity record
        activity = Activity(
            type='share',
            file_id=file_id,
            user_id=user_id
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'File shared successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500




@files_bp.route('/files/<int:file_id>/share/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_file_share(file_id: int, user_id: int):
    """Update file share permissions for a user."""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if 'permission' not in data:
            return jsonify({'error': 'Permission level is required'}), 400

        file = File.query.get_or_404(file_id)
        
        # Check if current user is the file owner or has admin permissions
        if not (file.owner_id == current_user_id or 
                any(share.user_id == current_user_id and share.permission == 'admin' 
                    for share in file.shares)):
            return jsonify({'error': 'Permission denied - must be file owner or admin'}), 403

        # Find the share to update
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Share not found'}), 404

        # Don't allow changing owner's permissions
        if user_id == file.owner_id:
            return jsonify({'error': 'Cannot modify owner permissions'}), 403

        # Update permission
        share.permission = data['permission']
        db.session.commit()

        # Log the action
        log_action(
            'UPDATE_SHARE', 
            current_user_id, 
            f'Updated share permissions for file {file_id} user {user_id} to {data["permission"]}'
        )

        return jsonify({
            'message': 'Share permissions updated successfully',
            'share': {
                'user_id': share.user_id,
                'permission': share.permission
            }
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error updating share: {str(e)}")
        return jsonify({'error': 'Failed to update share permissions'}), 500



@files_bp.route('/files/<int:file_id>/share/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_file_share(file_id: int, user_id: int):
    """Remove file share for a specific user."""
    try:
        current_user_id = int(get_jwt_identity())   
        file = File.query.get_or_404(file_id)
        # Check if current user is the file owner
        if not (file.owner_id == current_user_id):
            return jsonify({'error': 'Permission denied - must be file owner'}), 403

        # Check if target user has a share
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Share not found'}), 404
            
        # Don't allow removing owner's share
        if user_id == file.owner_id:
            return jsonify({'error': 'Cannot remove owner share'}), 403
            
        db.session.delete(share)
        db.session.commit()
        
        # Log the action
        log_action('REMOVE_SHARE', current_user_id, f'Removed share for file {file_id} from user {user_id}')
        
        return jsonify({'message': 'Share removed successfully'})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing share: {str(e)}")
        return jsonify({'error': 'Failed to remove share'}), 500




'''
@files_bp.route('/files/<file_id>/share', methods=['DELETE'])
@jwt_required()
def remove_share(file_id):
    """Remove file sharing for a user."""
    user_id = int(get_jwt_identity())
    file = File.query.get_or_404(file_id)
    
    # Check ownership
    if file.owner_id != user_id:
        return jsonify({'error': 'Only the owner can modify sharing'}), 403
    
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Find user to remove share from
    share_user = User.query.filter_by(email=email).first()
    if not share_user:
        return jsonify({'error': 'User not found'}), 404
    
    share = FileShare.query.filter_by(
        file_id=file_id,
        user_id=share_user.id
    ).first()
    
    if share:
        db.session.delete(share)
        db.session.commit()
    
    return jsonify({'message': 'Share removed successfully'})
'''





@files_bp.route('/activities', methods=['GET'])
@jwt_required()
def list_activities():
    """List recent activities."""
    user_id = int(get_jwt_identity())
    
    # Get activities for user's own files and shared files
    activities = Activity.query.join(File).filter(
        (File.owner_id == user_id) |
        (File.id.in_(
            db.session.query(FileShare.file_id)
            .filter(FileShare.user_id == user_id)
        ))
    ).order_by(Activity.created_at.desc()).limit(50).all()
    
    return jsonify({
        'activities': [activity.to_dict() for activity in activities]
    })

@files_bp.route('/files/<file_id>/activities', methods=['GET'])
@jwt_required()
def list_file_activities(file_id):
    """List activities for a specific file."""
    user_id = int(get_jwt_identity())
    file = File.query.get_or_404(file_id)
    
    # Check permissions
    if file.owner_id != user_id:
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Permission denied'}), 403
    
    activities = Activity.query.filter_by(file_id=file_id)\
        .order_by(Activity.created_at.desc()).all()
    
    return jsonify({
        'activities': [activity.to_dict() for activity in activities]
    })

@files_bp.route('/files/<file_id>/messages', methods=['GET'])
@jwt_required()
def list_messages(file_id):
    """List messages for a file."""
    user_id = int(get_jwt_identity())
    file = File.query.get_or_404(file_id)
    
    # Check permissions
    if file.owner_id != user_id:
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Permission denied'}), 403
    
    messages = Message.query.filter_by(file_id=file_id)\
        .order_by(Message.created_at.asc()).all()
    
    return jsonify({
        'messages': [message.to_dict() for message in messages]
    })

@files_bp.route('/files/<file_id>/messages', methods=['POST'])
@jwt_required()
def create_message(file_id):
    """Create a new message for a file."""
    user_id = int(get_jwt_identity())
    file = File.query.get_or_404(file_id)
    
    # Check permissions
    if file.owner_id != user_id:
        share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
        if not share:
            return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    content = data.get('content')
    
    if not content or not content.strip():
        return jsonify({'error': 'Message content is required'}), 400
    
    try:
        # Create message
        message = Message(
            content=content.strip(),
            file_id=file_id,
            user_id=user_id
        )
        
        # Create activity record
        activity = Activity(
            type='comment',
            file_id=file_id,
            user_id=user_id
        )
        
        db.session.add(message)
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': message.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
    
    
    
    
    
    

from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app.models.file import File
from app.models.file_share import FileShare
from app.models.user import User

@files_bp.route('/files/<file_id>/shared-users', methods=['GET'])
@jwt_required()
def get_file_shared_users(file_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    # Get file with eager loading of relationships
    file = File.query.get(file_id)

    if not file:
        return jsonify({'error': 'File not found'}), 404

    # Check if user is owner or has access to the file
    if file.owner_id != current_user.id and not any(
        share.user_id == current_user.id for share in file.shares
    ):
        return jsonify({'error': 'Unauthorized'}), 403

    shared_users = [
        {
            "id": share.user.id,
            "name": share.user.name,
            "email": share.user.email,
            "permission": share.permission
        }
        for share in file.shares
        if share.user and share.user.id != current_user.id
    ]

    return jsonify({
        'shared_users': shared_users,
        'total': len(shared_users)
    }), 200