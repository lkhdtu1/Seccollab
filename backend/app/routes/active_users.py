from flask import Blueprint, jsonify
from app.models.activeUser import ActiveUser
from flask_jwt_extended import jwt_required

active_users_bp = Blueprint('active_users', __name__)

@active_users_bp.route('/', methods=['GET'])
@jwt_required()
def get_active_users():
    """
    Retourne la liste des utilisateurs actifs.
    """
    active_users = ActiveUser.query.all()
    active_users_data = [
        {
            "id": user.id,
            "name": user.name,
            "action": user.action,
            "file_id": user.file_id,
            "last_active": user.last_active
        }
        for user in active_users
    ]
    return jsonify(active_users_data), 200