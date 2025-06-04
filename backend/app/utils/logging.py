from app.models.user import db
from datetime import datetime
import json

class Log(db.Model):
    __tablename__ = 'logs'
    
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Log {self.action} by user_id={self.user_id}>'
    
    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'user_id': self.user_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat()
        }

def log_action(action, user_id, details, ip_address=None):
    """
    Enregistre une action dans les logs avec contrôle d'accès.
    
    Args:
        action (str): Type d'action (LOGIN, LOGOUT, UPLOAD, etc.)
        user_id (int): ID de l'utilisateur qui effectue l'action
        details (str): Détails de l'action
        ip_address (str, optional): Adresse IP de l'utilisateur
    """
    log_entry = Log(
        action=action,
        user_id=user_id,
        details=details,
        ip_address=ip_address
    )
    
    log_entry.save()
    
    # En plus de l'enregistrement en base de données, on pourrait également
    # écrire dans un fichier de log pour une redondance de sécurité
    try:
        from flask import current_app
        current_app.logger.info(f"[{action}] User {user_id}: {details}")
    except:
        # Si nous ne sommes pas dans un contexte d'application Flask, ignorer
        pass
    
    return log_entry

def get_user_logs(user_id, limit=100):
    """
    Récupère les logs d'un utilisateur spécifique.
    
    Args:
        user_id (int): ID de l'utilisateur
        limit (int, optional): Nombre maximum de logs à récupérer
        
    Returns:
        list: Liste des logs de l'utilisateur
    """
    logs = Log.query.filter_by(user_id=user_id).order_by(Log.timestamp.desc()).limit(limit).all()
    return [log.to_dict() for log in logs]

def get_action_logs(action_type, limit=100):
    """
    Récupère les logs d'un type d'action spécifique.
    
    Args:
        action_type (str): Type d'action (LOGIN, LOGOUT, UPLOAD, etc.)
        limit (int, optional): Nombre maximum de logs à récupérer
        
    Returns:
        list: Liste des logs de ce type d'action
    """
    logs = Log.query.filter_by(action=action_type).order_by(Log.timestamp.desc()).limit(limit).all()
    return [log.to_dict() for log in logs]
