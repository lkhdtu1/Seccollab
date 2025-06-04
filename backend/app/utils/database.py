
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from app.models.user import db
import os


def init_db(app):
    """
    Initialise la base de données SQLite et crée les tables nécessaires.
    
    Args:
        app (Flask): L'application Flask
    """
    # Configurer SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser l'extension
    db.init_app(app)
    
    # Initialiser Flask-Migrate
    migrate = Migrate(app, db)
    
    # Créer le répertoire de la base de données s'il n'existe pas
    db_path = os.path.join(os.path.dirname(app.instance_path), 'instance')
    os.makedirs(db_path, exist_ok=True)
    
    # Créer les tables
    with app.app_context():
        from app.models.file import File, Activity, Message
        from app.models.activeUser import ActiveUser
        from app.models.user import User
        from app.models.Message import Chat
        #rom app.models.file_share import file_shares
        db.create_all()
        
    return db
