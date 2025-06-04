


from oauthlib.oauth2 import WebApplicationClient

from app.socketin import socketio, init_websocket
# Autoriser les connexions non sécurisées pour le développement
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
import dns.resolver

from app import create_app
from app.utils.database import init_db
from app.utils.init_storage import init_storage
from flask import Flask, jsonify
from authlib.integrations.flask_client import OAuth
import eventlet
eventlet.monkey_patch()

#socketio = SocketIO()
def main():
    """
    Point d'entrée principal pour l'application.
    Configure et lance l'application avec toutes les fonctionnalités de sécurité.
    """
    # Créer l'application Flask
    app = create_app()
    
    # Initialize WebSocket
    init_websocket(app)
    
    
    # Initialiser la base de données
    db = init_db(app)
    
    
    
    
    
    
     # Initialize Google OAuth client
    #client = WebApplicationClient(app.config['GOOGLE_CLIENT_ID'])
    
    
    # Initialiser le stockage
    storage_initialized = init_storage()
    
    if not storage_initialized:
        print("AVERTISSEMENT: L'initialisation du stockage a échoué, certaines fonctionnalités peuvent ne pas fonctionner correctement")
    
    # Enregistrer les blueprints supplémentaires
    with app.app_context():
        # Enregistrer le blueprint OAuth
        #from app.routes.oauth import oauth_bp
        #app.register_blueprint(oauth_bp, url_prefix='/api/oauth')
        
        # Enregistrer le blueprint Token
        from app.routes.token import token_bp
        app.register_blueprint(token_bp, url_prefix='/api/token')
        
        # Enregistrer le blueprint Admin
        from app.routes.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        
        # Enregistrer le blueprint Security
        from app.routes.security import security_bp
        app.register_blueprint(security_bp, url_prefix='/api/security')
        
        # Enregistrer le blueprint Audit
        from app.routes.audit import audit_bp
        app.register_blueprint(audit_bp, url_prefix='/api/audit')
        
        # Enregistrer le blueprint Collaboration
        from app.routes.collaboration import collaboration_bp
        app.register_blueprint(collaboration_bp, url_prefix='/api/collaboration')

        from app.routes.stats import stats_bp
        app.register_blueprint(stats_bp, url_prefix='/api/stats')
        
        from app.routes.scheduling import scheduling_bp
        app.register_blueprint(scheduling_bp, url_prefix='/api')
         
         
         # Register messages blueprint
        from app.routes.messaging import messages_bp
        app.register_blueprint(messages_bp, url_prefix='/api/messages')
        
    
    #socketio.init_app(app, cors_allowed_origins="*")    
    
      # Test route to verify API is working
    @app.route('/api/test')
    def test_route():
        return jsonify({"message": "API is working"}), 200
    
        
    return app


'''
@socketio.on('connect')
def handle_connect():
    print('Client connecté')
    socketio.send({'type': 'welcome', 'message': 'Bienvenue au WebSocket'})  # Exemple de message JSON

@socketio.on('disconnect')
def handle_disconnect():
    print('Client déconnecté')
@socketio.on('message')
def handle_message(message):
    print('Message reçu du client:', message)
    socketio.send({'type': 'file_update', 'message': 'Mise à jour des fichiers'})  # Exemple de message JSON
'''
if __name__ == '__main__':
    app = main()
    #app.run(host='0.0.0.0', port=5000, debug=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True,use_reloader=False)
    #socketio.run(app, host='0.0.0.0', port=5000, debug=True)  







