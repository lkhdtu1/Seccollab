from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from app.models.user import db
#rom app.models.file_share import file_shares
import uuid
class File(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  
    name = db.Column(db.String(255), nullable=False)
    storage_path = db.Column(db.String(512), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    shares = db.relationship('FileShare', back_populates='file', lazy='joined', cascade='all, delete-orphan')
    owner = db.relationship(
        'User',
        back_populates='files',
        overlaps="owned_files,owner_user"
    )
    activities = db.relationship('Activity', back_populates='file', cascade='all, delete-orphan')
    messages = db.relationship('Message', back_populates='file', cascade='all, delete-orphan')
    
    
    # Relations
    #shares = db.relationship('FileShare', backref='file', lazy=True, cascade="all, delete-orphan")file_shares
    
    def __repr__(self):
        return f'<File {self.name}>'
    
    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'mime_type': self.mime_type,
            'owner': self.owner.to_dict(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'shares': [{
                'user_id': share.user_id,
                'user_name': share.user.name if share.user else None,
                'user_email': share.user.email if share.user else None,
                'permission': share.permission
            } for share in self.shares]

        }







class Activity(db.Model):
    """Model for tracking file activities."""
    __tablename__ = 'activities'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = db.Column(db.String(20), nullable=False)  # upload, download, share, comment
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='activities')
    file = db.relationship('File', back_populates='activities')
    def __repr__(self):
        return f'<Activity {self.type} by User {self.user_id} on File {self.file_id}>'
    
    def to_dict(self):
        """Convert activity object to dictionary."""
        return {
            'id': self.id,
            'type': self.type,
            'fileName': self.file.name,
            'userName': self.user.name,
            'timestamp': self.created_at.isoformat()
        }


class Message(db.Model):
    """Model for file discussion messages."""
    __tablename__ = 'messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content = db.Column(db.Text, nullable=False)
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='messages')
    file = db.relationship('File', back_populates='messages')
    
    def to_dict(self):
        """Convert message object to dictionary."""
        return {
            'id': self.id,
            'content': self.content,
            'userId': self.user_id,
            'userName': self.user.name,
            'timestamp': self.created_at.isoformat()
        }