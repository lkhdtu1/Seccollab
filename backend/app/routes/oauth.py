from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from app.models.user import User
from app.utils.security import check_password, hash_password
from app.utils.logging import log_action
from app.utils.Email1 import send_email
import os
import requests
from oauthlib.oauth2 import WebApplicationClient
from datetime import timedelta
import json
from dotenv import load_dotenv
from flask import redirect, url_for
oauth_bp = Blueprint('oauth', __name__)
load_dotenv("test.env")
# Configuration OAuth2
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "mock-client-id")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "mock-client-secret")
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

# Client OAuth2
client = WebApplicationClient(GOOGLE_CLIENT_ID)

def get_google_provider_cfg():
    """Récupère la configuration du fournisseur Google OAuth2"""
    return requests.get(GOOGLE_DISCOVERY_URL).json()

@oauth_bp.route('/google/login')
def google_login():
    """Initie le flux d'authentification OAuth2 avec Google"""
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    redirect_uri = f"{request.base_url}/callback"
    print(f"Redirect URI utilisée : {request.base_url}/callback")
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=["openid", "email", "profile"],
    )
    return jsonify({"auth_url": request_uri})

@oauth_bp.route('/google/login/callback')
def google_callback():
    """Gère le callback de l'authentification OAuth2 avec Google"""
    code = request.args.get("code")
    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]

    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(token_url, headers=headers, data=body, auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET))
    token_response.raise_for_status()
    token_response = token_response.json()

    client.parse_request_body_response(json.dumps(token_response))

    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)
    userinfo_response.raise_for_status()
    userinfo = userinfo_response.json()

    users_email = userinfo["email"]
    users_name = userinfo.get("name", "Utilisateur Google")

    user = User.query.filter_by(email=users_email).first()
    if not user:
        random_password = os.urandom(16).hex()
        hashed_password = hash_password(random_password)
        user = User(email=users_email, name=users_name, password=hashed_password)
        user.save()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    log_action('OAUTH_LOGIN', user.id, f"Connexion OAuth réussie: {user.email}")
    # Redirigez vers le hub avec les tokens dans l'URL (ou utilisez des cookies)
    return redirect(f"{os.environ.get('FRONTEND_URL')}/hub?access_token={access_token}&refresh_token={refresh_token}")
    
    '''return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name
        }
    })'''

@oauth_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Envoie un email de réinitialisation de mot de passe"""
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    reset_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))
    reset_link = f"{os.environ.get('FRONTEND_URL')}/reset-password?token={reset_token}"

    send_email(
        to=email,
        subject="Réinitialisation de votre mot de passe",
        body=f"Veuillez cliquer sur ce lien pour réinitialiser votre mot de passe : {reset_link}"
    )

    return jsonify({'message': 'Email de réinitialisation envoyé'}), 200

@oauth_bp.route('/api/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    """Réinitialise le mot de passe de l'utilisateur"""
    current_user_id = get_jwt_identity()
    print(f"ID utilisateur actuel : {current_user_id}")  # Log de l'utilisateur

    data = request.get_json()
    print(f"Données reçues : {data}")  # Log des données reçues

    new_password = data.get('new_password')
    if not new_password:
        return jsonify({'message': 'Nouveau mot de passe requis'}), 400

    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    user.password = hash_password(new_password)
    user.save()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200