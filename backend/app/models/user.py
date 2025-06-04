from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
import pyotp
import secrets
import string
import uuid
db = SQLAlchemy()
#rom app.models.file_share import file_shares
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(512), nullable=True)
    
    # Security-related fields
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_login_attempt = db.Column(db.DateTime)
    account_locked_until = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime)
    session_token = db.Column(db.String(128))
    
    # Password reset fields
    password_reset_token = db.Column(db.String(100), unique=True)
    password_reset_expires = db.Column(db.DateTime)
    
    # OAuth related fields
    google_id = db.Column(db.String(128), unique=True, nullable=True)
      # MFA related fields
    mfa_secret = db.Column(db.String(32), nullable=True)
    mfa_enabled = db.Column(db.Boolean, default=False)
    
    # Stats related fields
    daily_login_count = db.Column(db.Integer, default=0)
    last_login_date = db.Column(db.Date)
    
    
    # Files relationship
    files = db.relationship(
            'File',
            back_populates='owner',
            lazy='dynamic',
            overlaps="owned_files,owner_user"
        )
    file_shares = db.relationship(
            'FileShare',
            back_populates='user',
            cascade='all, delete-orphan'
        )
    # Schedule relationship
    
    
    # Update schedule relationships
    created_schedules = db.relationship(
        'Schedule',
        back_populates='creator',
        foreign_keys='Schedule.creator_id',
        lazy='dynamic'
    )
    schedule_participations = db.relationship(
        'ScheduleParticipant',
        back_populates='user',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    schedule_notifications = db.relationship(
        'ScheduleNotification',
        back_populates='user',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    
    
    
    '''
    # Schedule relationships
    created_schedules = db.relationship('Schedule', backref='creator', lazy='dynamic')
    schedule_participations = db.relationship('ScheduleParticipant', backref='user', lazy='dynamic')
    schedule_notifications = db.relationship('ScheduleNotification', backref='user', lazy='dynamic')
  '''  # Remember device functionality
    trusted_devices = db.relationship('TrustedDevice', backref='user', lazy='dynamic')
    def set_password(self, password):
            """Set user password."""
            self.password = generate_password_hash(password)
        
    def check_password(self, password):
        """Check password with rate limiting."""
        if self.account_locked_until and self.account_locked_until > datetime.utcnow():
            return False
            
        if not check_password_hash(self.password, password):
            self.failed_login_attempts += 1
            self.last_login_attempt = datetime.utcnow()
            
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
            
            db.session.commit()
            return False
            
        # Reset counters on successful login
        self.failed_login_attempts = 0
        self.last_login_attempt = datetime.utcnow()
        self.last_active = datetime.utcnow()
        db.session.commit()
        return True
    
    
    
    
    def generate_mfa_secret(self):
        """Generate a new MFA secret key."""
        self.mfa_secret = pyotp.random_base32()
        return self.mfa_secret
    
    def get_mfa_uri(self, issuer_name):
        """Get the MFA URI for QR code generation."""
        return pyotp.totp.TOTP(self.mfa_secret).provisioning_uri(
            name=self.email, 
            issuer_name=issuer_name
        )
    
   # Inside User model
    def verify_mfa_code(self, code: str) -> bool:
        if not self.mfa_secret:
            return False
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(code, valid_window=1)  # Accepts codes ±30s
    def get_session_data(self):
        """Get user data for session."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'mfa_enabled': self.mfa_enabled
        }
        
    def is_device_trusted(self, device_id):
        """Check if a device is in the trusted devices list."""
        return self.trusted_devices.filter_by(device_id=device_id).first() is not None
    
    def add_trusted_device(self, user_agent, ip_address):
        """Add a device to trusted devices."""
        # Generate a unique device ID
        device_id = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        
        # Create and add the trusted device
        trusted_device = TrustedDevice(
            user_id=self.id,
            device_id=device_id,
            user_agent=user_agent,
            ip_address=ip_address,
            last_used_at=datetime.utcnow()
        )
        db.session.add(trusted_device)
        
        return device_id
    

    @classmethod
    def get_by_email(cls, email):
        """Find a user by email."""
        return cls.query.filter_by(email=email).first()
    
    @classmethod
    def get_by_google_id(cls, google_id):
        """Find a user by Google ID."""
        return cls.query.filter_by(google_id=google_id).first()
    
    def to_dict(self, include_email=True):
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'mfa_enabled': self.mfa_enabled,
            'password': self.password is not None,
            'google_connected': self.google_id is not None
        }
    

class TrustedDevice(db.Model):
    """Model for storing trusted devices that bypass MFA."""
    __tablename__ = 'trusted_devices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_id = db.Column(db.String(32), nullable=False)
    user_agent = db.Column(db.String(256))
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def update_last_used(self):
        """Update the last used timestamp."""
        self.last_used_at = datetime.utcnow()
    # Relations
   # files = db.relationship('File', backref='owner', lazy=True)
   # shared_files = db.relationship('FileShare', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    

    
    
    
    
class Schedule(db.Model):
    """Model for scheduling meetings."""
    __tablename__ = 'schedules'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
     # Update relationships
    creator = db.relationship(
        'User',
        back_populates='created_schedules',
        foreign_keys=[creator_id]
    )
    participants = db.relationship(
        'ScheduleParticipant',
        back_populates='schedule',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    notifications = db.relationship(
        'ScheduleNotification',
        back_populates='schedule',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    # In the Schedule class, update the to_dict method:
    
    def to_dict(self):
        """Convert schedule object to dictionary."""
        try:
            creator = User.query.get(self.creator_id)
            participants_list = []
            
            for p in self.participants.all():
                try:
                    user = User.query.get(p.user_id)
                    if user:
                        participants_list.append({
                            'id': user.id,
                            'name': user.name,
                            'status': p.status
                        })
                except Exception as pe:
                    print(f"Error processing participant: {str(pe)}")
                    continue
                    
            return {
                'id': str(self.id),
                'title': self.title,
                'description': self.description or '',
                'startTime': self.start_time.isoformat() if self.start_time else None,
                'endTime': self.end_time.isoformat() if self.end_time else None,
                'creator': {
                    'id': creator.id,
                    'name': creator.name
                } if creator else None,
                'participants': participants_list,
                'created_at': self.created_at.isoformat() if self.created_at else None
            }
        except Exception as e:
            print(f"Error in schedule.to_dict(): {str(e)}")
            return None

class ScheduleParticipant(db.Model):
    """Model for schedule participants."""
    __tablename__ = 'schedule_participants'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    schedule_id = db.Column(db.String(36), db.ForeignKey('schedules.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(10), nullable=False)  # pending, accepted, declined
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
     # Update relationships
    schedule = db.relationship('Schedule', back_populates='participants')
    user = db.relationship('User', back_populates='schedule_participations')

    
    def to_dict(self):
        """Convert participant object to dictionary."""
        return {
            'id': self.user.id,
            'name': self.user.name,
            'status': self.status
        }


class ScheduleNotification(db.Model):
    """Model for schedule notifications."""
    __tablename__ = 'schedule_notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    schedule_id = db.Column(db.String(36), db.ForeignKey('schedules.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # email, in_app
    status = db.Column(db.String(10), nullable=False)  # pending, sent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Update relationships
    schedule = db.relationship('Schedule', back_populates='notifications')
    user = db.relationship('User', back_populates='schedule_notifications')