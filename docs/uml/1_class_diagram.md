# Class Diagram - SecCollab Platform

## Database Models and Relationships

```plantuml
@startuml SecCollab_Class_Diagram

!define ENTITY(name,desc) class name as "name" << (E,#FFAAAA) >> {
!define VALUE(name,desc) class name as "name" << (V,#AAFFAA) >> {
!define SERVICE(name,desc) class name as "name" << (S,#AAAAFF) >> {

' Core User Management
ENTITY(User, "User Entity") {
    +id: Integer [PK]
    +email: String [UNIQUE]
    +name: String
    +password: String [HASHED]
    +is_active: Integer
    +mfa_enabled: Boolean
    +mfa_secret: String
    +google_id: String
    +avatar_url: String
    +oauth_provider: String
    +profile_image: LargeBinary
    +created_at: DateTime
    +updated_at: DateTime
    --
    +check_password(password): Boolean
    +set_password(password): Void
    +to_dict(): Dict
}

' File Management System
ENTITY(File, "File Entity") {
    +id: Integer [PK]
    +name: String
    +storage_path: String
    +size: Integer
    +mime_type: String
    +encrypted: Boolean
    +owner_id: Integer [FK]
    +created_at: DateTime
    +updated_at: DateTime
    --
    +to_dict(): Dict
    +get_activities(): List<Activity>
    +get_messages(): List<Message>
}

' File Sharing System
ENTITY(FileShare, "File Share Entity") {
    +id: Integer [PK]
    +file_id: Integer [FK]
    +user_id: Integer [FK]
    +permission: Enum ['read', 'write']
    +created_at: DateTime
    --
    +to_dict(): Dict
}

' File Activity Tracking
ENTITY(Activity, "Activity Entity") {
    +id: Integer [PK]
    +file_id: Integer [FK]
    +user_id: Integer [FK]
    +type: Enum ['upload', 'download', 'share', 'comment']
    +description: String
    +created_at: DateTime
    --
    +to_dict(): Dict
}

' File-based Messaging
ENTITY(Message, "File Message Entity") {
    +id: Integer [PK]
    +file_id: Integer [FK]
    +user_id: Integer [FK]
    +content: Text
    +created_at: DateTime
    --
    +to_dict(): Dict
}

' Scheduling System
ENTITY(Schedule, "Schedule Entity") {
    +id: String [PK]
    +title: String
    +description: Text
    +start_time: DateTime
    +end_time: DateTime
    +creator_id: Integer [FK]
    +created_at: DateTime
    +updated_at: DateTime
    --
    +to_dict(): Dict
    +get_participants(): List<ScheduleParticipant>
}

ENTITY(ScheduleParticipant, "Schedule Participant Entity") {
    +id: String [PK]
    +schedule_id: String [FK]
    +user_id: Integer [FK]
    +status: Enum ['pending', 'accepted', 'declined']
    +created_at: DateTime
    --
    +to_dict(): Dict
}

ENTITY(ScheduleNotification, "Schedule Notification Entity") {
    +id: String [PK]
    +schedule_id: String [FK]
    +user_id: Integer [FK]
    +type: Enum ['email', 'in_app']
    +status: Enum ['pending', 'sent', 'failed']
    +created_at: DateTime
    --
    +to_dict(): Dict
}

' Real-time Chat System
ENTITY(Chat, "Chat Message Entity") {
    +id: String [PK]
    +sender_id: Integer [FK]
    +receiver_id: Integer [FK]
    +content: Text
    +content_type: Enum ['text', 'image', 'video']
    +file_url: String
    +file_name: String
    +created_at: DateTime
    --
    +to_dict(): Dict
}

' Active User Tracking
ENTITY(ActiveUser, "Active User Entity") {
    +id: Integer [PK]
    +user_id: Integer [FK]
    +file_id: Integer [FK]
    +last_active: DateTime
    +status: Enum ['online', 'away', 'offline']
    --
    +to_dict(): Dict
}

' Audit and Logging
ENTITY(Log, "Audit Log Entity") {
    +id: Integer [PK]
    +action: String
    +user_id: Integer [FK]
    +details: Text
    +ip_address: String
    +timestamp: DateTime
    --
    +to_dict(): Dict
}

' Service Classes
SERVICE(AuthService, "Authentication Service") {
    +register_user(email, name, password): User
    +login_user(email, password): Token
    +verify_token(token): User
    +setup_mfa(user): String
    +verify_mfa(user, code): Boolean
    +oauth_login(provider, code): User
    +forgot_password(email): Boolean
    +reset_password(token, password): Boolean
}

SERVICE(FileService, "File Management Service") {
    +upload_file(file, user): File
    +download_file(file_id, user): FileData
    +share_file(file_id, user_id, permission): FileShare
    +delete_file(file_id, user): Boolean
    +encrypt_file(file_data): EncryptedData
    +decrypt_file(encrypted_data): FileData
    +list_user_files(user): List<File>
    +get_shared_files(user): List<File>
}

SERVICE(SchedulingService, "Scheduling Service") {
    +create_schedule(data, creator): Schedule
    +list_schedules(user): List<Schedule>
    +respond_to_schedule(schedule_id, user, status): Boolean
    +cancel_schedule(schedule_id, user): Boolean
    +send_notifications(schedule, type): Boolean
}

SERVICE(MessagingService, "Messaging Service") {
    +send_message(sender, receiver, content): Chat
    +get_messages(user1, user2): List<Chat>
    +upload_media_message(sender, receiver, file): Chat
    +send_file_message(file_id, user, content): Message
    +get_file_messages(file_id): List<Message>
}

SERVICE(SecurityService, "Security Service") {
    +hash_password(password): String
    +check_password(password, hash): Boolean
    +generate_token(user): String
    +verify_token(token): User
    +log_action(action, user, details): Log
    +rate_limit_check(user, action): Boolean
    +validate_input(data, schema): Boolean
}

SERVICE(WebSocketService, "Real-time Communication Service") {
    +handle_connection(user): Boolean
    +join_room(user, room): Void
    +leave_room(user, room): Void
    +emit_message(room, data): Void
    +broadcast_update(type, data): Void
}

' Relationships
User ||--o{ File : "owns"
User ||--o{ FileShare : "shared_with"
User ||--o{ Activity : "performs"
User ||--o{ Message : "sends"
User ||--o{ Schedule : "creates"
User ||--o{ ScheduleParticipant : "participates"
User ||--o{ ScheduleNotification : "receives"
User ||--o{ Chat : "sends"
User ||--o{ Chat : "receives"
User ||--o{ ActiveUser : "tracks"
User ||--o{ Log : "generates"

File ||--o{ FileShare : "shared_as"
File ||--o{ Activity : "has"
File ||--o{ Message : "discussed_in"
File ||--o{ ActiveUser : "accessed_by"

Schedule ||--o{ ScheduleParticipant : "includes"
Schedule ||--o{ ScheduleNotification : "sends"

' Constraints and Notes
note top of User : "Implements secure authentication\nwith MFA and OAuth support"
note top of File : "Supports encryption and\nsecure file sharing"
note top of Schedule : "Meeting scheduling with\nemail notifications"
note top of Chat : "Real-time messaging with\nmedia support"
note top of ActiveUser : "Real-time user presence\ntracking"

@enduml
```

## Key Design Patterns

### 1. **Model-View-Controller (MVC)**
- **Models**: Database entities (User, File, Schedule, etc.)
- **Views**: React components (Hub, FileShare, ScheduleList, etc.)
- **Controllers**: Flask route handlers (auth.py, files.py, scheduling.py, etc.)

### 2. **Service Layer Pattern**
- Business logic separated into service classes
- Services handle complex operations and cross-cutting concerns
- Clean separation between controllers and data access

### 3. **Repository Pattern**
- SQLAlchemy ORM provides data access abstraction
- Models encapsulate database operations
- Consistent interface for data manipulation

### 4. **Observer Pattern**
- WebSocket events for real-time updates
- File activity notifications
- User presence tracking

### 5. **Strategy Pattern**
- Multiple authentication strategies (JWT, OAuth2, MFA)
- Different notification methods (email, in-app)
- Various file storage backends (local, GCP)

## Security Considerations

### 1. **Authentication & Authorization**
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- OAuth2 integration

### 2. **Data Protection**
- Password hashing with bcrypt
- File encryption (AES)
- Input validation and sanitization
- SQL injection prevention

### 3. **Audit & Monitoring**
- Comprehensive action logging
- Security event tracking
- Rate limiting
- IP-based monitoring

## Scalability Features

### 1. **Database Design**
- Proper indexing on foreign keys
- Efficient query patterns
- Pagination support
- Connection pooling

### 2. **Real-time Communication**
- WebSocket rooms for targeted messaging
- Event-driven architecture
- Asynchronous processing

### 3. **File Management**
- Cloud storage integration
- File streaming for large files
- Compression and optimization
