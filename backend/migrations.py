from flask_migrate import Migrate
from app import create_app
from app.models.user import db
import os

# Créer les migrations pour la base de données
def create_migrations():
    """
    Crée les migrations pour la base de données SQLite.
    """
    app = create_app()
    
    # Configurer SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser l'extension
    db.init_app(app)
    
    # Initialiser Flask-Migrate
    migrate = Migrate(app, db)
    
    # Créer le répertoire des migrations s'il n'existe pas
    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
    os.makedirs(migrations_dir, exist_ok=True)
    
    return app, db, migrate

if __name__ == '__main__':
    app, db, migrate = create_migrations()
    with app.app_context():
        db.create_all()
