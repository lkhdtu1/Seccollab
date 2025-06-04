from app.utils.database import db

class ActiveUser(db.Model):
    __tablename__ = 'active_user'
   
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # viewing, editing
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Clé étrangère vers 'users.id'
    last_active = db.Column(db.String(50), nullable=False)
    
    user = db.relationship('User', backref='active_users')  # Relation avec le modèle User
    file = db.relationship('File', backref='active_users')