from flask import Blueprint, jsonify
from app.models.user import User
from flask_jwt_extended import jwt_required

collaborators_bp = Blueprint('collaborators', __name__)

@collaborators_bp.route('/', methods=['GET'])
@jwt_required()
def get_collaborators():
    """
    Retourne la liste des collaborateurs disponibles.
    """
    collaborators = User.query.all()
    collaborators_data = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "status": user.status  # Assurez-vous que le modèle User a un champ `status`
        }
        for user in collaborators
    ]
    return jsonify(collaborators_data), 200