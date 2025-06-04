from app.utils.database import db
from datetime import datetime

class Chat(db.Model):
    __tablename__ = 'chat'
    
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.String(36), primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_type = db.Column(db.String(10), nullable=False)
    file_url = db.Column(db.String(255))
    file_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')


    def to_dict(self):
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'content': self.content,
            'contentType': self.content_type,
            'fileUrl': self.file_url,
            'fileName': self.file_name,
            'createdAt': self.created_at.isoformat(),
            'readAt': self.read_at.isoformat() if self.read_at else None
        }
        