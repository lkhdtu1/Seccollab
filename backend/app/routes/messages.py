from flask import Blueprint, jsonify, request
from app.models.Message import Message
from app.utils.database import db
from flask_jwt_extended import jwt_required, get_jwt_identity

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/files/<int:file_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(file_id):
    """
    Retourne les messages associés à un fichier.
    """
    messages = Message.query.filter_by(file_id=file_id).all()
    messages_data = [
        {
            "id": message.id,
            "user_id": message.user_id,
            "user_name": message.user.name,
            "text": message.text,
            "timestamp": message.timestamp.isoformat()
        }
        for message in messages
    ]
    return jsonify(messages_data), 200

@messages_bp.route('/files/<int:file_id>/messages', methods=['POST'])
@jwt_required()
def post_message(file_id):
    """
    Ajoute un nouveau message à un fichier.
    """
    current_user_id = get_jwt_identity()
    data = request.json
    new_message = Message(
        file_id=file_id,
        user_id=current_user_id,
        text=data.get('text')
    )
    db.session.add(new_message)
    db.session.commit()

    return jsonify({
        "id": new_message.id,
        "user_id": new_message.user_id,
        "user_name": new_message.user.name,
        "text": new_message.text,
        "timestamp": new_message.timestamp.isoformat()
    }), 201