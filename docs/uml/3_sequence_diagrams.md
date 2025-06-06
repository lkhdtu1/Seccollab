# Sequence Diagrams - SecCollab Platform

## Key Workflow Processes

### 1. User Authentication Sequence

```plantuml
@startuml User_Authentication_Sequence

actor User
participant "Frontend\n(React)" as Frontend
participant "Auth Service\n(Flask)" as AuthService
participant "Database\n(SQLite)" as Database
participant "JWT Service" as JWT
participant "MFA Service" as MFA

== Standard Login ==
User -> Frontend: Enter credentials
Frontend -> AuthService: POST /api/auth/login\n{email, password}
AuthService -> Database: Query user by email
Database --> AuthService: User record
AuthService -> AuthService: Verify password hash
AuthService -> JWT: Generate access token
JWT --> AuthService: JWT token
AuthService -> Database: Log login activity
AuthService --> Frontend: {token, user_info}
Frontend -> Frontend: Store token in localStorage
Frontend --> User: Redirect to dashboard

== MFA-Enabled Login ==
User -> Frontend: Enter credentials
Frontend -> AuthService: POST /api/auth/login\n{email, password}
AuthService -> Database: Query user by email
Database --> AuthService: User record (mfa_enabled=true)
AuthService -> AuthService: Verify password hash
AuthService --> Frontend: {mfa_required: true}
Frontend --> User: Show MFA input
User -> Frontend: Enter TOTP code
Frontend -> AuthService: POST /api/auth/verify-mfa\n{email, totp_code}
AuthService -> MFA: Verify TOTP code
MFA --> AuthService: Verification result
alt MFA Valid
    AuthService -> JWT: Generate access token
    JWT --> AuthService: JWT token
    AuthService -> Database: Log successful MFA login
    AuthService --> Frontend: {token, user_info}
    Frontend --> User: Redirect to dashboard
else MFA Invalid
    AuthService -> Database: Log failed MFA attempt
    AuthService --> Frontend: {error: "Invalid MFA code"}
    Frontend --> User: Show error message
end

== OAuth Login ==
User -> Frontend: Click "Login with Google"
Frontend -> AuthService: GET /api/auth/login/google
AuthService --> Frontend: Redirect to Google OAuth
Frontend --> User: Redirect to Google
User -> "Google OAuth" as Google: Authenticate
Google --> AuthService: OAuth callback with code
AuthService -> Google: Exchange code for user info
Google --> AuthService: User profile data
AuthService -> Database: Check if user exists
alt User Exists
    AuthService -> Database: Update OAuth info
else New User
    AuthService -> Database: Create new user record
end
AuthService -> JWT: Generate access token
JWT --> AuthService: JWT token
AuthService -> Database: Log OAuth login
AuthService --> Frontend: Redirect with token
Frontend --> User: Login successful

@enduml
```

### 2. File Upload and Sharing Sequence

```plantuml
@startuml File_Upload_Sharing_Sequence

actor User as FileOwner
actor "Shared User" as SharedUser
participant "Frontend\n(React)" as Frontend
participant "File Service\n(Flask)" as FileService
participant "Storage Service\n(GCP/Local)" as Storage
participant "Encryption Service" as Encryption
participant "Database\n(SQLite)" as Database
participant "WebSocket\nService" as WebSocket
participant "Notification\nService" as NotificationService

== File Upload Process ==
FileOwner -> Frontend: Select file for upload
Frontend -> Frontend: Validate file type and size
Frontend -> FileService: POST /api/files/upload\n{file, metadata}
FileService -> FileService: Generate unique filename
FileService -> Encryption: Encrypt file content
Encryption --> FileService: Encrypted file data
FileService -> Storage: Store encrypted file
Storage --> FileService: Storage path/URL
FileService -> Database: Create file record
Database --> FileService: File ID
FileService -> Database: Log upload activity
FileService --> Frontend: {file_id, file_info}
Frontend -> WebSocket: Emit file_update event
WebSocket -> WebSocket: Broadcast to connected users
Frontend --> FileOwner: Upload successful

== File Sharing Process ==
FileOwner -> Frontend: Select file to share
Frontend -> Frontend: Show sharing dialog
FileOwner -> Frontend: Select users and permissions
Frontend -> FileService: POST /api/files/share\n{file_id, user_ids, permissions}
FileService -> Database: Verify file ownership
Database --> FileService: Ownership confirmed
loop For each shared user
    FileService -> Database: Create FileShare record
    Database --> FileService: Share record created
    FileService -> Database: Log sharing activity
end
FileService -> NotificationService: Send share notifications
NotificationService -> Database: Query shared user details
Database --> NotificationService: User information
NotificationService -> "Email Service" as Email: Send sharing email
Email --> NotificationService: Email sent
FileService --> Frontend: Sharing successful
Frontend -> WebSocket: Emit file_share event
WebSocket -> SharedUser: Real-time share notification
Frontend --> FileOwner: File shared successfully

== File Access by Shared User ==
SharedUser -> Frontend: View shared files
Frontend -> FileService: GET /api/files/shared
FileService -> Database: Query files shared with user
Database --> FileService: Shared file list
FileService --> Frontend: {shared_files}
SharedUser -> Frontend: Download shared file
Frontend -> FileService: GET /api/files/download/{file_id}
FileService -> Database: Verify user permissions
Database --> FileService: Permission validated
FileService -> Storage: Retrieve encrypted file
Storage --> FileService: Encrypted file data
FileService -> Encryption: Decrypt file content
Encryption --> FileService: Decrypted file data
FileService -> Database: Log download activity
FileService --> Frontend: File content
Frontend --> SharedUser: File download complete

@enduml
```

### 3. Real-time Messaging Sequence

```plantuml
@startuml Real_time_Messaging_Sequence

actor "User A" as UserA
actor "User B" as UserB
participant "Frontend A\n(React)" as FrontendA
participant "Frontend B\n(React)" as FrontendB
participant "Message Service\n(Flask)" as MessageService
participant "WebSocket\nService" as WebSocket
participant "Database\n(SQLite)" as Database

== WebSocket Connection Setup ==
UserA -> FrontendA: Login to application
FrontendA -> WebSocket: Connect with JWT token
WebSocket -> WebSocket: Verify JWT token
WebSocket -> WebSocket: Join user room (user_A)
WebSocket --> FrontendA: Connection established

UserB -> FrontendB: Login to application
FrontendB -> WebSocket: Connect with JWT token
WebSocket -> WebSocket: Verify JWT token
WebSocket -> WebSocket: Join user room (user_B)
WebSocket --> FrontendB: Connection established

== Direct Message Exchange ==
UserA -> FrontendA: Open chat with User B
FrontendA -> MessageService: GET /api/messages/{user_B_id}
MessageService -> Database: Query message history
Database --> MessageService: Message list
MessageService --> FrontendA: Chat history

UserA -> FrontendA: Type and send message
FrontendA -> MessageService: POST /api/messages/send\n{receiver_id, content, type}
MessageService -> Database: Save message
Database --> MessageService: Message saved with ID
MessageService -> WebSocket: Emit to user_B room
WebSocket -> FrontendB: new_message event
FrontendB -> FrontendB: Update chat UI
MessageService --> FrontendA: Message sent confirmation
FrontendA -> FrontendA: Update chat UI

== File-based Discussion ==
UserA -> FrontendA: Open file discussion
FrontendA -> MessageService: GET /api/files/{file_id}/messages
MessageService -> Database: Query file messages
Database --> MessageService: File message list
MessageService --> FrontendA: File discussion history

UserA -> FrontendA: Post comment on file
FrontendA -> MessageService: POST /api/files/{file_id}/messages\n{content}
MessageService -> Database: Save file message
Database --> MessageService: Message saved
MessageService -> Database: Query users with file access
Database --> MessageService: User list
loop For each user with file access
    MessageService -> WebSocket: Emit file_message_update
    WebSocket -> "Frontend X": Update file discussion
end
MessageService --> FrontendA: Comment posted

== Media Message Upload ==
UserA -> FrontendA: Select image/video to send
FrontendA -> MessageService: POST /api/messages/upload\n{file, receiver_id}
MessageService -> "Storage Service" as Storage: Upload media file
Storage --> MessageService: File URL
MessageService -> Database: Save message with media
Database --> MessageService: Message saved
MessageService -> WebSocket: Emit media message
WebSocket -> FrontendB: new_message event (with media)
FrontendB -> FrontendB: Display media in chat
MessageService --> FrontendA: Media sent confirmation

== Presence and Typing Indicators ==
UserA -> FrontendA: Start typing message
FrontendA -> WebSocket: typing_start event
WebSocket -> FrontendB: Show typing indicator
FrontendB -> FrontendB: Display "User A is typing..."

UserA -> FrontendA: Stop typing (after timeout)
FrontendA -> WebSocket: typing_stop event
WebSocket -> FrontendB: Hide typing indicator
FrontendB -> FrontendB: Remove typing indicator

UserA -> FrontendA: Close chat or go inactive
FrontendA -> WebSocket: user_away event
WebSocket -> WebSocket: Update user status
WebSocket -> FrontendB: presence_update event
FrontendB -> FrontendB: Update user status (away)

@enduml
```

### 4. Meeting Scheduling Sequence

```plantuml
@startuml Meeting_Scheduling_Sequence

actor "Meeting Creator" as Creator
actor "Participant 1" as Participant1
actor "Participant 2" as Participant2
participant "Frontend\n(React)" as Frontend
participant "Schedule Service\n(Flask)" as ScheduleService
participant "Database\n(SQLite)" as Database
participant "Email Service" as EmailService
participant "WebSocket\nService" as WebSocket

== Meeting Creation ==
Creator -> Frontend: Open schedule dialog
Frontend -> ScheduleService: GET /api/auth/users
ScheduleService -> Database: Query available users
Database --> ScheduleService: User list
ScheduleService --> Frontend: Available users

Creator -> Frontend: Fill meeting details and select participants
Frontend -> ScheduleService: POST /api/schedules\n{title, description, start_time, end_time, participants, notify_via}
ScheduleService -> Database: Create schedule record
Database --> ScheduleService: Schedule created with ID

loop For each participant
    ScheduleService -> Database: Create participant record (status: pending)
    Database --> ScheduleService: Participant record created
    
    alt Email notification selected
        ScheduleService -> Database: Create email notification record
        ScheduleService -> EmailService: Send meeting invitation
        EmailService --> ScheduleService: Email sent status
        ScheduleService -> Database: Update notification status
    end
    
    alt In-app notification selected
        ScheduleService -> Database: Create in-app notification
        ScheduleService -> WebSocket: Emit meeting_invitation
        WebSocket -> "Participant Frontend": Real-time notification
    end
end

ScheduleService -> Database: Log schedule creation activity
ScheduleService --> Frontend: Schedule created successfully
Frontend --> Creator: Show success message

== Participant Response ==
Participant1 -> "Participant Frontend" as ParticipantFrontend: View meeting invitation
ParticipantFrontend -> ScheduleService: GET /api/schedules
ScheduleService -> Database: Query user's schedules
Database --> ScheduleService: Schedule list (including pending)
ScheduleService --> ParticipantFrontend: Meeting invitations

Participant1 -> ParticipantFrontend: Accept meeting invitation
ParticipantFrontend -> ScheduleService: POST /api/schedules/{schedule_id}/respond\n{status: "accepted"}
ScheduleService -> Database: Update participant status
Database --> ScheduleService: Status updated
ScheduleService -> Database: Log response activity
ScheduleService -> WebSocket: Emit schedule_response
WebSocket -> Frontend: Notify creator of response
ScheduleService --> ParticipantFrontend: Response recorded

== Meeting Cancellation ==
Creator -> Frontend: Cancel meeting
Frontend -> ScheduleService: DELETE /api/schedules/{schedule_id}
ScheduleService -> Database: Verify creator permissions
Database --> ScheduleService: Permission confirmed
ScheduleService -> Database: Mark schedule as cancelled
ScheduleService -> Database: Query all participants
Database --> ScheduleService: Participant list

loop For each participant
    ScheduleService -> EmailService: Send cancellation email
    EmailService --> ScheduleService: Email sent
    ScheduleService -> WebSocket: Emit meeting_cancelled
    WebSocket -> "Participant Frontend": Real-time cancellation notice
end

ScheduleService -> Database: Log cancellation activity
ScheduleService --> Frontend: Meeting cancelled
Frontend --> Creator: Cancellation confirmed

== Schedule Listing and Updates ==
Participant2 -> ParticipantFrontend: View upcoming meetings
ParticipantFrontend -> ScheduleService: GET /api/schedules
ScheduleService -> Database: Query user's schedules\n(created + participating)
Database --> ScheduleService: Schedule list with details
ScheduleService --> ParticipantFrontend: Formatted schedule data

note right of ScheduleService
  Schedules include:
  - Meeting details
  - Participant list with status
  - Creator information
  - Response status for current user
end note

ParticipantFrontend -> WebSocket: Listen for schedule updates
WebSocket -> ParticipantFrontend: Real-time schedule changes
ParticipantFrontend -> ParticipantFrontend: Update UI automatically

@enduml
```

### 5. Security Audit and Monitoring Sequence

```plantuml
@startuml Security_Audit_Monitoring_Sequence

actor Admin
actor "Regular User" as User
participant "Frontend\n(React)" as Frontend
participant "Security Service\n(Flask)" as SecurityService
participant "Audit Service\n(Flask)" as AuditService
participant "Database\n(SQLite)" as Database
participant "File Scanner" as Scanner
participant "Rate Limiter" as RateLimit

== Security Monitoring ==
User -> Frontend: Attempt multiple failed logins
Frontend -> SecurityService: POST /api/auth/login (failed attempts)
SecurityService -> RateLimit: Check attempt count
RateLimit --> SecurityService: Rate limit exceeded
SecurityService -> Database: Log security violation
Database --> SecurityService: Violation logged
SecurityService --> Frontend: Account temporarily locked
Frontend --> User: Show lockout message

== File Security Scan ==
Admin -> Frontend: Initiate security scan
Frontend -> SecurityService: POST /api/audit/security-scan/{file_id}
SecurityService -> Database: Verify admin privileges
Database --> SecurityService: Admin confirmed
SecurityService -> Database: Retrieve file information
Database --> SecurityService: File metadata
SecurityService -> Scanner: Analyze file content
Scanner -> Scanner: Check for malware/threats
Scanner --> SecurityService: Scan results
SecurityService -> Database: Log scan results
SecurityService --> Frontend: Security report
Frontend --> Admin: Display scan results

== Audit Log Review ==
Admin -> Frontend: Access audit logs
Frontend -> AuditService: GET /api/admin/logs?filters
AuditService -> Database: Verify admin privileges
Database --> AuditService: Admin confirmed
AuditService -> Database: Query audit logs with filters
Database --> AuditService: Filtered log entries
AuditService --> Frontend: Audit log data
Frontend --> Admin: Display audit interface

== Integrity Verification ==
Admin -> Frontend: Check file integrity
Frontend -> SecurityService: GET /api/audit/integrity-check/{file_id}
SecurityService -> Database: Retrieve file hash
Database --> SecurityService: Original file hash
SecurityService -> "Storage Service" as Storage: Retrieve current file
Storage --> SecurityService: Current file data
SecurityService -> SecurityService: Calculate current hash
SecurityService -> SecurityService: Compare hashes
alt Integrity Valid
    SecurityService -> Database: Log integrity check (passed)
    SecurityService --> Frontend: File integrity confirmed
else Integrity Compromised
    SecurityService -> Database: Log integrity violation
    SecurityService -> Database: Flag file as compromised
    SecurityService --> Frontend: Integrity violation detected
    Frontend --> Admin: Alert of compromised file
end

== User Activity Monitoring ==
User -> Frontend: Perform various actions
Frontend -> SecurityService: API calls with JWT
SecurityService -> Database: Log all user actions
Database --> SecurityService: Actions logged

Admin -> Frontend: View user activity
Frontend -> AuditService: GET /api/audit/user-activity?user_id
AuditService -> Database: Query user's activity logs
Database --> AuditService: Activity history
AuditService --> Frontend: User activity timeline
Frontend --> Admin: Display activity report

== Automated Security Alerts ==
SecurityService -> SecurityService: Monitor for suspicious patterns
SecurityService -> Database: Query recent activities
Database --> SecurityService: Activity data
SecurityService -> SecurityService: Analyze for anomalies
alt Suspicious Activity Detected
    SecurityService -> Database: Create security alert
    SecurityService -> "Alert Service" as AlertService: Send admin notification
    AlertService -> Admin: Security alert notification
    SecurityService -> Database: Log security event
end

@enduml
```

## Key Sequence Patterns

### 1. **Authentication Flow Pattern**
- Token-based authentication with JWT
- Optional MFA verification step
- OAuth integration for external providers
- Comprehensive activity logging

### 2. **File Operations Pattern**
- Permission verification before actions
- Encryption/decryption for sensitive files
- Real-time notifications via WebSocket
- Activity tracking for audit purposes

### 3. **Real-time Communication Pattern**
- WebSocket connections with room-based messaging
- Persistent message storage in database
- Presence tracking and typing indicators
- Media upload with file streaming

### 4. **Notification System Pattern**
- Multiple notification channels (email, in-app, WebSocket)
- Asynchronous processing for email delivery
- Real-time updates for connected users
- Fallback mechanisms for reliability

### 5. **Security and Audit Pattern**
- Comprehensive logging of all actions
- Rate limiting and abuse prevention
- File integrity verification
- Admin oversight and monitoring tools

## Error Handling Strategies

### 1. **Authentication Errors**
- Invalid credentials: Clear error messages
- Account lockout: Temporary restrictions
- Token expiration: Automatic refresh attempts
- MFA failures: Limited retry attempts

### 2. **File Operation Errors**
- Permission denied: Clear access messages
- File not found: Graceful error handling
- Storage failures: Retry mechanisms
- Upload errors: Progress and status feedback

### 3. **Communication Errors**
- WebSocket disconnection: Automatic reconnection
- Message delivery failures: Retry queues
- Network timeouts: User notifications
- Media upload failures: Progress tracking

### 4. **System Errors**
- Database connectivity: Connection pooling
- Service unavailability: Circuit breakers
- Resource exhaustion: Rate limiting
- Security violations: Immediate blocking
