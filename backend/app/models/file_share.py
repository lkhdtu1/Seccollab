from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from app.models.user import db
from sqlalchemy.orm import relationship
class FileShare(db.Model):
    __tablename__ = 'file_shares'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    file_id = db.Column(db.Integer, db.ForeignKey('files.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    permission = db.Column(db.String(10), nullable=False)  # 'read' or 'write'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    
    file = db.relationship("File", back_populates="shares")
    user = db.relationship("User", back_populates="file_shares")
    
    __table_args__ = (
        db.UniqueConstraint('file_id', 'user_id', name='uq_file_share_user'),
    )
    
    def __repr__(self):
        return f'<FileShare file_id={self.file_id} user_id={self.user_id}>'
    
    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    def to_dict(self):
        """Convert file share object to dictionary."""
        return {
            'id': self.id,
            'file_id': self.file_id,
            'user': self.user.to_dict(),
            'permission': self.permission,
            'created_at': self.created_at.isoformat()
        }

from app.utils.database import db

