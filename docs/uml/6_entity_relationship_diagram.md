# Entity Relationship Diagram - SecCollab Platform

## Database Schema Overview

The SecCollab platform uses a relational database design with carefully structured entities to support secure collaboration, file sharing, real-time communication, and comprehensive audit capabilities.

## Core Entity Relationships

```
                    ┌─────────────────────────┐
                    │         USER            │
                    │─────────────────────────│
                    │ + id: INTEGER (PK)      │
                    │ + email: VARCHAR(255)   │
                    │ + name: VARCHAR(255)    │
                    │ + password: VARCHAR(255)│
                    │ + profile_picture: TEXT │
                    │ + mfa_enabled: BOOLEAN  │
                    │ + mfa_secret: VARCHAR   │
                    │ + email_verified: BOOLEAN│
                    │ + is_active: BOOLEAN    │
                    │ + last_login: DATETIME  │
                    │ + created_at: DATETIME  │
                    │ + updated_at: DATETIME  │
                    └─────────────────────────┘
                              │
                              │ 1:N
                              ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                        FILES                                    │
    │─────────────────────────────────────────────────────────────────│
    │ + id: INTEGER (PK)                                             │
    │ + name: VARCHAR(255)                                           │
    │ + original_name: VARCHAR(255)                                  │
    │ + size: BIGINT                                                 │
    │ + mime_type: VARCHAR(100)                                      │
    │ + storage_path: TEXT                                           │
    │ + is_encrypted: BOOLEAN                                        │
    │ + encryption_key: VARCHAR                                      │
    │ + checksum: VARCHAR(64)                                        │
    │ + is_deleted: BOOLEAN                                          │
    │ + deleted_at: DATETIME                                         │
    │ + owner_id: INTEGER (FK → USER.id)                             │
    │ + created_at: DATETIME                                         │
    │ + updated_at: DATETIME                                         │
    └─────────────────────────────────────────────────────────────────┘
              │                                    │
              │ 1:N                               │ 1:N
              ▼                                    ▼
┌───────────────────────────┐            ┌─────────────────────────┐
│      FILE_SHARE           │            │       ACTIVITY          │
│───────────────────────────│            │─────────────────────────│
│ + id: INTEGER (PK)        │            │ + id: INTEGER (PK)      │
│ + file_id: INTEGER (FK)   │            │ + type: VARCHAR(50)     │
│ + user_id: INTEGER (FK)   │            │ + description: TEXT     │
│ + permission: ENUM        │            │ + file_id: INTEGER (FK) │
│   ('read', 'write')       │            │ + user_id: INTEGER (FK) │
│ + shared_by: INTEGER (FK) │            │ + ip_address: VARCHAR   │
│ + created_at: DATETIME    │            │ + user_agent: TEXT      │
│ + expires_at: DATETIME    │            │ + timestamp: DATETIME   │
└───────────────────────────┘            └─────────────────────────┘
              │                                    │
              │ N:1                               │ N:1
              ▼                                    ▼
    ┌─────────────────────────┐                  │
    │         USER            │                  │
    │ (Referenced Entity)     │◄─────────────────┘
    └─────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SCHEDULE                                 │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + title: VARCHAR(255)                                          │
│ + description: TEXT                                            │
│ + start_time: DATETIME                                         │
│ + end_time: DATETIME                                           │
│ + location: VARCHAR(255)                                       │
│ + meeting_link: TEXT                                           │
│ + is_recurring: BOOLEAN                                        │
│ + recurrence_pattern: VARCHAR                                  │
│ + status: ENUM ('active', 'cancelled', 'completed')           │
│ + creator_id: INTEGER (FK → USER.id)                           │
│ + created_at: DATETIME                                         │
│ + updated_at: DATETIME                                         │
└─────────────────────────────────────────────────────────────────┘
              │                                    │
              │ 1:N                               │ 1:N
              ▼                                    ▼
┌───────────────────────────┐            ┌─────────────────────────────┐
│   SCHEDULE_PARTICIPANT    │            │   SCHEDULE_NOTIFICATION     │
│───────────────────────────│            │─────────────────────────────│
│ + id: INTEGER (PK)        │            │ + id: INTEGER (PK)          │
│ + schedule_id: INTEGER(FK)│            │ + schedule_id: INTEGER (FK) │
│ + user_id: INTEGER (FK)   │            │ + user_id: INTEGER (FK)     │
│ + status: ENUM            │            │ + type: ENUM                │
│   ('pending', 'accepted', │            │   ('email', 'in_app', 'sms')│
│    'declined')            │            │ + sent_at: DATETIME         │
│ + response_time: DATETIME │            │ + delivered: BOOLEAN        │
│ + notes: TEXT             │            │ + created_at: DATETIME      │
│ + created_at: DATETIME    │            └─────────────────────────────┘
│ + updated_at: DATETIME    │
└───────────────────────────┘
              │
              │ N:1
              ▼
    ┌─────────────────────────┐
    │         USER            │
    │ (Referenced Entity)     │
    └─────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MESSAGE                                  │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + content: TEXT                                                │
│ + message_type: ENUM ('text', 'file', 'image', 'system')      │
│ + is_encrypted: BOOLEAN                                        │
│ + sender_id: INTEGER (FK → USER.id)                            │
│ + receiver_id: INTEGER (FK → USER.id)                          │
│ + file_id: INTEGER (FK → FILES.id) [NULLABLE]                 │
│ + parent_message_id: INTEGER (FK → MESSAGE.id) [NULLABLE]     │
│ + is_read: BOOLEAN                                             │
│ + read_at: DATETIME                                            │
│ + is_deleted: BOOLEAN                                          │
│ + deleted_at: DATETIME                                         │
│ + created_at: DATETIME                                         │
│ + updated_at: DATETIME                                         │
└─────────────────────────────────────────────────────────────────┘
              │
              │ 1:N (self-referencing)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CHAT                                    │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + file_id: INTEGER (FK → FILES.id)                             │
│ + user_id: INTEGER (FK → USER.id)                              │
│ + message: TEXT                                                │
│ + message_type: ENUM ('comment', 'system', 'mention')         │
│ + parent_comment_id: INTEGER (FK → CHAT.id) [NULLABLE]        │
│ + is_edited: BOOLEAN                                           │
│ + edited_at: DATETIME                                          │
│ + created_at: DATETIME                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Security & Audit Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVE_USER                                │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + user_id: INTEGER (FK → USER.id)                              │
│ + session_token: VARCHAR(255)                                  │
│ + ip_address: VARCHAR(45)                                      │
│ + user_agent: TEXT                                             │
│ + device_fingerprint: VARCHAR(255)                             │
│ + is_trusted_device: BOOLEAN                                   │
│ + location_data: JSON                                          │
│ + last_activity: DATETIME                                      │
│ + login_time: DATETIME                                         │
│ + logout_time: DATETIME                                        │
│ + is_active: BOOLEAN                                           │
│ + created_at: DATETIME                                         │
└─────────────────────────────────────────────────────────────────┘
              │
              │ N:1
              ▼
    ┌─────────────────────────┐
    │         USER            │
    │ (Referenced Entity)     │
    └─────────────────────────┘
              │
              │ 1:N
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUDIT_LOG                                 │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + user_id: INTEGER (FK → USER.id) [NULLABLE]                  │
│ + action: VARCHAR(100)                                         │
│ + entity_type: VARCHAR(50)                                     │
│ + entity_id: INTEGER                                           │
│ + old_values: JSON                                             │
│ + new_values: JSON                                             │
│ + ip_address: VARCHAR(45)                                      │
│ + user_agent: TEXT                                             │
│ + session_id: VARCHAR(255)                                     │
│ + risk_level: ENUM ('low', 'medium', 'high', 'critical')      │
│ + success: BOOLEAN                                             │
│ + error_message: TEXT                                          │
│ + timestamp: DATETIME                                          │
│ + created_at: DATETIME                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY_LOG                                │
│─────────────────────────────────────────────────────────────────│
│ + id: INTEGER (PK)                                             │
│ + event_type: VARCHAR(100)                                     │
│ + severity: ENUM ('info', 'warning', 'error', 'critical')     │
│ + source: VARCHAR(100)                                         │
│ + message: TEXT                                                │
│ + details: JSON                                                │
│ + user_id: INTEGER (FK → USER.id) [NULLABLE]                  │
│ + ip_address: VARCHAR(45)                                      │
│ + resolved: BOOLEAN                                            │
│ + resolved_by: INTEGER (FK → USER.id) [NULLABLE]              │
│ + resolved_at: DATETIME                                        │
│ + timestamp: DATETIME                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Extended Relationship Definitions

### 1. User-Centric Relationships

```
USER (1) ──────────── (N) FILES
  │                         │
  │ owns                   │ references
  │                         │
  ▼                         ▼
  └─ created_files[]        └─ owner: User

USER (1) ──────────── (N) FILE_SHARE
  │                         │
  │ shares_to              │ references  
  │                         │
  ▼                         ▼
  └─ shared_files[]         └─ shared_user: User

USER (1) ──────────── (N) SCHEDULE
  │                         │
  │ creates                │ references
  │                         │
  ▼                         ▼
  └─ created_schedules[]    └─ creator: User

USER (N) ──────────── (N) SCHEDULE (via SCHEDULE_PARTICIPANT)
  │                         │
  │ participates_in        │ has_participants
  │                         │
  ▼                         ▼
  └─ schedule_participations[] └─ participants[]
```

### 2. File-Centric Relationships

```
FILES (1) ─────────── (N) FILE_SHARE
  │                         │
  │ shared_via             │ references
  │                         │
  ▼                         ▼
  └─ shares[]               └─ file: Files

FILES (1) ─────────── (N) ACTIVITY  
  │                         │
  │ has_activities         │ references
  │                         │
  ▼                         ▼
  └─ activities[]           └─ file: Files

FILES (1) ─────────── (N) CHAT
  │                         │
  │ has_discussions        │ references
  │                         │
  ▼                         ▼
  └─ file_chats[]           └─ file: Files

FILES (1) ─────────── (N) MESSAGE
  │                         │
  │ attached_to            │ references
  │                         │
  ▼                         ▼
  └─ message_attachments[]  └─ attached_file: Files
```

### 3. Communication Relationships

```
MESSAGE (1) ──────── (N) MESSAGE (Self-Referencing)
  │                         │
  │ replies                │ references
  │                         │
  ▼                         ▼
  └─ replies[]              └─ parent_message: Message

USER (1) ──────────── (N) MESSAGE (as Sender)
  │                         │
  │ sends                  │ references
  │                         │
  ▼                         ▼
  └─ sent_messages[]        └─ sender: User

USER (1) ──────────── (N) MESSAGE (as Receiver)
  │                         │
  │ receives               │ references
  │                         │
  ▼                         ▼
  └─ received_messages[]    └─ receiver: User

CHAT (1) ──────────── (N) CHAT (Self-Referencing)
  │                         │
  │ has_replies            │ references
  │                         │
  ▼                         ▼
  └─ replies[]              └─ parent_comment: Chat
```

## Database Constraints and Indexes

### Primary Keys
- All entities have `id` as INTEGER PRIMARY KEY AUTO_INCREMENT

### Foreign Key Constraints
```sql
-- File ownership
ALTER TABLE files ADD CONSTRAINT fk_files_owner 
  FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE;

-- File sharing
ALTER TABLE file_share ADD CONSTRAINT fk_share_file
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;
ALTER TABLE file_share ADD CONSTRAINT fk_share_user
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;
ALTER TABLE file_share ADD CONSTRAINT fk_share_sharer
  FOREIGN KEY (shared_by) REFERENCES user(id) ON DELETE SET NULL;

-- Activity tracking
ALTER TABLE activity ADD CONSTRAINT fk_activity_file
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;
ALTER TABLE activity ADD CONSTRAINT fk_activity_user
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL;

-- Schedule management
ALTER TABLE schedule ADD CONSTRAINT fk_schedule_creator
  FOREIGN KEY (creator_id) REFERENCES user(id) ON DELETE CASCADE;

-- Schedule participation
ALTER TABLE schedule_participant ADD CONSTRAINT fk_participant_schedule
  FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE;
ALTER TABLE schedule_participant ADD CONSTRAINT fk_participant_user
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;

-- Messaging system
ALTER TABLE message ADD CONSTRAINT fk_message_sender
  FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE;
ALTER TABLE message ADD CONSTRAINT fk_message_receiver
  FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE CASCADE;
ALTER TABLE message ADD CONSTRAINT fk_message_file
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE message ADD CONSTRAINT fk_message_parent
  FOREIGN KEY (parent_message_id) REFERENCES message(id) ON DELETE CASCADE;

-- File chat
ALTER TABLE chat ADD CONSTRAINT fk_chat_file
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;
ALTER TABLE chat ADD CONSTRAINT fk_chat_user
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;
ALTER TABLE chat ADD CONSTRAINT fk_chat_parent
  FOREIGN KEY (parent_comment_id) REFERENCES chat(id) ON DELETE CASCADE;
```

### Unique Constraints
```sql
-- Prevent duplicate email registration
ALTER TABLE user ADD CONSTRAINT uk_user_email UNIQUE (email);

-- Prevent duplicate file shares
ALTER TABLE file_share ADD CONSTRAINT uk_file_user_share 
  UNIQUE (file_id, user_id);

-- Prevent duplicate schedule participation
ALTER TABLE schedule_participant ADD CONSTRAINT uk_schedule_user_participation
  UNIQUE (schedule_id, user_id);

-- Ensure unique session tokens
ALTER TABLE active_user ADD CONSTRAINT uk_session_token 
  UNIQUE (session_token);
```

### Performance Indexes
```sql
-- File operations
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_created ON files(created_at);
CREATE INDEX idx_files_deleted ON files(is_deleted, deleted_at);
CREATE INDEX idx_files_name ON files(name);

-- File sharing
CREATE INDEX idx_share_file ON file_share(file_id);
CREATE INDEX idx_share_user ON file_share(user_id);
CREATE INDEX idx_share_permission ON file_share(permission);

-- Activity tracking
CREATE INDEX idx_activity_file ON activity(file_id);
CREATE INDEX idx_activity_user ON activity(user_id);
CREATE INDEX idx_activity_timestamp ON activity(timestamp);
CREATE INDEX idx_activity_type ON activity(type);

-- Schedule management
CREATE INDEX idx_schedule_creator ON schedule(creator_id);
CREATE INDEX idx_schedule_time ON schedule(start_time, end_time);
CREATE INDEX idx_schedule_status ON schedule(status);

-- Messaging
CREATE INDEX idx_message_sender ON message(sender_id);
CREATE INDEX idx_message_receiver ON message(receiver_id);
CREATE INDEX idx_message_timestamp ON message(created_at);
CREATE INDEX idx_message_thread ON message(parent_message_id);

-- Security and audit
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- Session management
CREATE INDEX idx_active_user_session ON active_user(session_token);
CREATE INDEX idx_active_user_activity ON active_user(last_activity);
CREATE INDEX idx_active_user_ip ON active_user(ip_address);
```

## Data Integrity Rules

### 1. **Business Rules**
- A user cannot share a file they don't own without proper permissions
- Schedule end time must be after start time
- File shares must have valid expiration dates (if set)
- Messages cannot be sent to non-existent users
- Activity logs are immutable once created

### 2. **Security Rules**
- Passwords must be hashed using bcrypt
- Session tokens must be cryptographically secure
- File encryption keys are stored separately from file content
- Audit logs capture all significant security events
- MFA secrets are encrypted at rest

### 3. **Data Retention Rules**
- Deleted files are soft-deleted with 30-day recovery period
- Audit logs are retained for compliance (configurable)
- Session data expires based on security policy
- Message history follows data retention policies
- User accounts can be anonymized on deletion

## Database Views for Common Queries

### 1. **User File Summary View**
```sql
CREATE VIEW user_file_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(f.id) as total_files,
    SUM(f.size) as total_size,
    COUNT(fs.id) as shared_files_count,
    MAX(f.created_at) as last_upload
FROM user u
LEFT JOIN files f ON u.id = f.owner_id AND f.is_deleted = 0
LEFT JOIN file_share fs ON f.id = fs.file_id
GROUP BY u.id, u.name;
```

### 2. **Recent Activity View**
```sql
CREATE VIEW recent_activity AS
SELECT 
    a.id,
    a.type,
    a.description,
    u.name as user_name,
    f.name as file_name,
    a.timestamp
FROM activity a
JOIN user u ON a.user_id = u.id
LEFT JOIN files f ON a.file_id = f.id
ORDER BY a.timestamp DESC
LIMIT 100;
```

### 3. **Security Dashboard View**
```sql
CREATE VIEW security_dashboard AS
SELECT 
    sl.severity,
    sl.event_type,
    COUNT(*) as event_count,
    MAX(sl.timestamp) as latest_event,
    COUNT(CASE WHEN sl.resolved = 0 THEN 1 END) as unresolved_count
FROM security_log sl
WHERE sl.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY sl.severity, sl.event_type
ORDER BY sl.severity DESC, event_count DESC;
```

## Scalability Considerations

### 1. **Partitioning Strategy**
- Partition `audit_log` by timestamp (monthly)
- Partition `activity` by timestamp (quarterly)
- Partition `message` by sender_id for horizontal scaling

### 2. **Archive Strategy**
- Move old audit logs to archive tables
- Compress inactive file data
- Implement tiered storage for large files

### 3. **Replication Setup**
- Master-slave replication for read scaling
- Read replicas for reporting queries
- Geographic distribution for global access
