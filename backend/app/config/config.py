import os
from datetime import timedelta

class Config:
    # Configuration générale
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'clé-secrète-par-défaut-à-changer-en-production'
    DEBUG = False
    TESTING = False
    
    
   # OAuth Configuration
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
    
    # Configuration JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-clé-secrète-par-défaut-à-changer-en-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ERROR_MESSAGE_KEY = 'error'

    # Configuration Base de données
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # MFA Configuration
    MFA_ISSUER_NAME = 'YourAppName'
    
    
    
    # Configuration GCP Storage
    GOOGLE_CLOUD_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT')
    GCP_STORAGE_BUCKET = os.environ.get('GCP_STORAGE_BUCKET') or 'secure-collab-platform-bucket'
    STORAGE_URL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'AVATARS')
    GCP_CREDENTIALS = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    # Configuration des fichiers
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
    
    # Configuration de sécurité
    BCRYPT_LOG_ROUNDS = 12
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
class ProductionConfig(Config):
    # En production, toutes les clés secrètes doivent être définies via des variables d'environnement
    pass
