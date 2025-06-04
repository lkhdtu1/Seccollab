import uuid
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User, db
from app.models.Message import Chat
from app.storingfiles import upload_file
from app.socketin import socketio
from datetime import datetime
messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/<int:receiver_id>', methods=['GET'])
@jwt_required()
def get_messages(receiver_id):
    current_user = get_jwt_identity()
    messages = Chat.query.filter(
        ((Chat.sender_id == current_user) & (Chat.receiver_id == receiver_id)) |
        ((Chat.sender_id == receiver_id) & (Chat.receiver_id == current_user))
    ).order_by(Chat.created_at.asc()).all()
    
    return jsonify([message.to_dict() for message in messages])

@messages_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()

        if not data or 'receiver_id' not in data or 'content' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        message = Chat(
            id=str(uuid.uuid4()),
            sender_id=int(current_user),
            receiver_id=int(data['receiver_id']),
            content=str(data['content']),
            content_type=str(data.get('content_type', 'text')),
            created_at=datetime.utcnow()
        )

        db.session.add(message)
        db.session.commit()

        message_dict = message.to_dict()

        # Emit via WebSocket
        socketio.emit('new_message', {
            'sender_id': current_user,
            'message': message_dict
        }, room=f'user_{data["receiver_id"]}')

        return jsonify(message_dict), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in send_message: {str(e)}")
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_message_file():
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.debug(f"Starting file upload for user {current_user_id}")
        
        if 'file' not in request.files:
            current_app.logger.error("No file in request")
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if not file.filename:
            current_app.logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400

        # Log file details
        current_app.logger.debug(f"File details - Name: {file.filename}, Content-Type: {file.content_type}")

        # Check file type
        content_type = file.content_type
        if not (content_type.startswith('image/') or content_type.startswith('video/')):
            current_app.logger.error(f"Invalid content type: {content_type}")
            return jsonify({'error': 'Only images and videos are allowed'}), 400

        # Log form data
        current_app.logger.debug(f"Form data: {request.form.to_dict()}")
        receiver_id = request.form.get('receiverId')
        if not receiver_id:
            current_app.logger.error("No receiver ID in request")
            return jsonify({'error': 'No receiver specified'}), 400

        try:
            current_app.logger.debug("Attempting to upload file...")
            file_url = upload_file(file)
            current_app.logger.debug(f"File uploaded successfully: {file_url}")
        except Exception as upload_error:
            current_app.logger.error(f"File upload failed: {str(upload_error)}")
            current_app.logger.error(f"Upload error traceback: {current_app.logger.formatException()}")
            return jsonify({'error': f'File upload failed: {str(upload_error)}'}), 500

        try:
            # Create message with media type
            message = Chat(
                id=str(uuid.uuid4()),
                sender_id=int(current_user_id),
                receiver_id=int(receiver_id),
                content=str(file_url),
                content_type='image' if content_type.startswith('image/') else 'video',
                file_url=str(file_url),
                file_name=str(file.filename),
                created_at=datetime.utcnow()
            )
            
            current_app.logger.debug(f"Saving message to database: {message.to_dict()}")
            db.session.add(message)
            db.session.commit()
            
            message_dict = message.to_dict()
            
            # Emit via WebSocket with media type info
            socketio.emit('new_message', {
                'sender_id': current_user_id,
                'message': message_dict
            }, room=f'user_{receiver_id}')
            
            return jsonify(message_dict), 201
            
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(db_error)}")
            current_app.logger.error(f"Database error traceback: {current_app.logger.formatException()}")
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error in upload_message_file: {str(e)}")
        current_app.logger.error(f"Error traceback: {current_app.logger.formatException()}")
        return jsonify({'error': str(e)}), 500