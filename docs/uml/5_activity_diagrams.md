# Activity Diagrams - SecCollab Platform

## Overview

Activity diagrams show the flow of activities and decisions within business processes of the SecCollab platform. These diagrams capture the dynamic behavior of the system and illustrate how different actors interact with the system to accomplish their goals.

## 1. User Registration & Onboarding Activity

```
START
  │
  ▼
┌─────────────────────────┐
│    User Registration    │
│      Process Start      │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│  Fill Registration Form │
│  - Email               │
│  - Name                │
│  - Password            │
│  - Captcha             │
└─────────────────────────┘
  │
  ▼
◊─────────────────────────◊
│   Validate Input        │
◊─────────────────────────◊
  │                    │
  │ Valid              │ Invalid
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Create Account  │  │ Show Error      │
│ - Hash Password │  │ Return to Form  │
│ - Generate JWT  │  └─────────────────┘
│ - Send Welcome  │         │
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Email Verification    │ │
│   - Send Verify Link    │ │
│   - Set Account Status  │ │
└─────────────────────────┘ │
  │                         │
  ▼                         │
◊─────────────────────────◊ │
│  Account Verified?      │ │
◊─────────────────────────◊ │
  │                    │    │
  │ Yes                │ No │
  ▼                    ▼    │
┌─────────────────┐  ┌─────┴────────────┐
│ Welcome to Hub  │  │ Resend Verify    │
│ - Setup Profile │  │ - Timeout Check  │
│ - Initial Tour  │  │ - Manual Verify  │
└─────────────────┘  └──────────────────┘
  │                         │
  ▼                         │
◊─────────────────────────◊ │
│    Setup MFA?           │ │
◊─────────────────────────◊ │
  │                    │    │
  │ Yes                │ No │
  ▼                    ▼    │
┌─────────────────┐  ┌─────┴────────────┐
│ MFA Setup Flow  │  │ Complete Setup   │
│ - QR Code Gen   │  │ - Default Prefs  │
│ - Code Verify   │  │ - Access Granted │
│ - Backup Codes  │  └──────────────────┘
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Registration Complete │ │
│   - Profile Created     │ │
│   - Preferences Set     │◄┘
│   - Access Granted      │
└─────────────────────────┘
  │
  ▼
END
```

## 2. File Upload & Sharing Workflow

```
START
  │
  ▼
┌─────────────────────────┐
│   User Selects File     │
│   - Browse File         │
│   - Drag & Drop         │
│   - Multiple Selection  │
└─────────────────────────┘
  │
  ▼
◊─────────────────────────◊
│   File Size Check       │
│   (Max 50MB)           │
◊─────────────────────────◊
  │                    │
  │ Valid              │ Too Large
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Start Upload    │  │ Show Size Error │
│ - Progress Bar  │  │ Suggest Compression │
│ - Chunk Upload  │  └─────────────────┘
│ - Error Handle  │         │
└─────────────────┘         │
  │                         │
  ▼                         │
◊─────────────────────────◊ │
│   Upload Success?       │ │
◊─────────────────────────◊ │
  │                    │    │
  │ Success            │ Failed │
  ▼                    ▼    │
┌─────────────────┐  ┌─────┴────────────┐
│ File Processing │  │ Upload Retry     │
│ - Virus Scan    │  │ - Error Analysis │
│ - Metadata Ext  │  │ - Resume Upload  │
│ - Preview Gen   │  └──────────────────┘
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Security Check        │ │
│   - File Type Valid     │ │
│   - Content Scan        │ │
│   - Permission Check    │ │
└─────────────────────────┘ │
  │                         │
  ▼                         │
◊─────────────────────────◊ │
│   Security Passed?      │ │
◊─────────────────────────◊ │
  │                    │    │
  │ Passed             │ Failed │
  ▼                    ▼    │
┌─────────────────┐  ┌─────┴────────────┐
│ Save to Storage │  │ Quarantine File  │
│ - DB Entry      │  │ - Security Alert │
│ - File System   │  │ - Admin Notice   │
│ - Activity Log  │  └──────────────────┘
└─────────────────┘         │
  │                         │
  ▼                         │
◊─────────────────────────◊ │
│   Share File?           │ │
◊─────────────────────────◊ │
  │                    │    │
  │ Yes                │ No │
  ▼                    ▼    │
┌─────────────────┐  ┌─────┴────────────┐
│ Sharing Dialog  │  │ Upload Complete  │
│ - Select Users  │  │ - File Available │
│ - Set Permissions│  │ - Notify User    │
│ - Send Invite   │  └──────────────────┘
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Create Share Record   │ │
│   - Permission Matrix   │ │
│   - Notification Send   │ │
│   - Activity Update     │ │
└─────────────────────────┘ │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   File Upload Complete  │◄┘
│   - Success Message     │
│   - File List Update    │
│   - Activity Feed       │
└─────────────────────────┘
  │
  ▼
END
```

## 3. Real-time Messaging Activity

```
START
  │
  ▼
┌─────────────────────────┐
│   User Opens Chat       │
│   - Select Recipient    │
│   - Load Chat History   │
│   - Connect WebSocket   │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│   Initialize Chat UI    │
│   - Load Messages       │
│   - Setup Event Listen  │
│   - Show Online Status  │
└─────────────────────────┘
  │
  ▼
╔═════════════════════════╗
║   PARALLEL ACTIVITIES   ║
╠═════════════════════════╣
║ ┌─────────────────────┐ ║
║ │ Message Sending     │ ║
║ │ Activity            │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Type Message        │ ║
║ │ - Text Input        │ ║
║ │ - File Attach       │ ║
║ │ - Emoji Select      │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ◊─────────────────────◊ ║
║ │ Message Valid?      │ ║
║ ◊─────────────────────◊ ║
║   │              │      ║
║   │ Valid        │ Empty║
║   ▼              ▼      ║
║ ┌─────────────┐ ┌─────┐ ║
║ │ Send Message│ │ Wait│ ║
║ │ - WebSocket │ └─────┘ ║
║ │ - DB Store  │        ║
║ │ - Encrypt   │        ║
║ └─────────────┘        ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Update UI           │ ║
║ │ - Message Bubble    │ ║
║ │ - Timestamp         │ ║
║ │ - Delivery Status   │ ║
║ └─────────────────────┘ ║
╠═════════════════════════╣
║ ┌─────────────────────┐ ║
║ │ Message Receiving   │ ║
║ │ Activity            │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ WebSocket Listen    │ ║
║ │ - Event Handler     │ ║
║ │ - Message Parse     │ ║
║ │ - Validation        │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ◊─────────────────────◊ ║
║ │ Message for User?   │ ║
║ ◊─────────────────────◊ ║
║   │              │      ║
║   │ Yes          │ No   ║
║   ▼              ▼      ║
║ ┌─────────────┐ ┌─────┐ ║
║ │ Process Msg │ │Ignore│ ║
║ │ - Decrypt   │ └─────┘ ║
║ │ - Store     │        ║
║ │ - Notify    │        ║
║ └─────────────┘        ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Update Chat UI      │ ║
║ │ - New Message       │ ║
║ │ - Sound Alert       │ ║
║ │ - Badge Update      │ ║
║ └─────────────────────┘ ║
╚═════════════════════════╝
  │
  ▼
◊─────────────────────────◊
│   User Closes Chat?     │
◊─────────────────────────◊
  │                    │
  │ No                 │ Yes
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Continue Chat   │  │ Close Connection│
│ - Keep Socket   │  │ - Save State    │
│ - Persist State │  │ - Cleanup       │
└─────────────────┘  └─────────────────┘
  │                         │
  ▼                         ▼
┌─────────────────────────┐ END
│   Return to Chat Loop   │
└─────────────────────────┘
  │
  ▼
 Loop Back to Parallel Activities
```

## 4. Meeting Scheduling Process

```
START
  │
  ▼
┌─────────────────────────┐
│   Create Meeting        │
│   - Click Schedule      │
│   - Open Dialog         │
│   - Load Participants   │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│   Fill Meeting Details  │
│   - Title & Description │
│   - Date & Time         │
│   - Duration            │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│   Select Participants   │
│   - Browse Users        │
│   - Search Filter       │
│   - Multi-select        │
└─────────────────────────┘
  │
  ▼
◊─────────────────────────◊
│   Time Conflict Check   │
◊─────────────────────────◊
  │                    │
  │ No Conflict        │ Conflict Found
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Set Notification│  │ Show Conflicts  │
│ Preferences     │  │ - Suggest Times │
│ - Email         │  │ - Reschedule    │
│ - In-App        │  └─────────────────┘
│ - SMS           │         │
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Create Schedule       │ │
│   - Save to Database    │ │
│   - Generate ICS        │ │
│   - Set Reminders       │ │
└─────────────────────────┘ │
  │                         │
  ▼                         │
╔═════════════════════════╗ │
║   NOTIFICATION PROCESS  ║ │
╠═════════════════════════╣ │
║ ┌─────────────────────┐ ║ │
║ │ For Each Participant│ ║ │
║ └─────────────────────┘ ║ │
║           │             ║ │
║           ▼             ║ │
║ ┌─────────────────────┐ ║ │
║ │ Send Invitation     │ ║ │
║ │ - Email Invite      │ ║ │
║ │ - In-App Notice     │ ║ │
║ │ - Calendar Entry    │ ║ │
║ └─────────────────────┘ ║ │
║           │             ║ │
║           ▼             ║ │
║ ┌─────────────────────┐ ║ │
║ │ Create Participant  │ ║ │
║ │ Record              │ ║ │
║ │ - Status: Pending   │ ║ │
║ │ - Notification Sent │ ║ │
║ └─────────────────────┘ ║ │
╚═════════════════════════╝ │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Schedule Created      │◄┘
│   - Success Message     │
│   - Calendar Update     │
│   - Activity Log        │
└─────────────────────────┘
  │
  ▼
╔═════════════════════════╗
║  RESPONSE HANDLING      ║
╠═════════════════════════╣
║ ┌─────────────────────┐ ║
║ │ Participant         │ ║
║ │ Receives Invite     │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ◊─────────────────────◊ ║
║ │ Response Action?    │ ║
║ ◊─────────────────────◊ ║
║ │        │        │    ║
║ │Accept  │Decline │Maybe║
║ ▼        ▼        ▼    ║
║┌───────┐┌───────┐┌────┐║
║│Accept ││Decline││Wait│║
║│Status ││Status ││    │║
║└───────┘└───────┘└────┘║
║ │        │        │    ║
║ ▼        ▼        ▼    ║
║ ┌─────────────────────┐ ║
║ │ Update Database     │ ║
║ │ - Participant Status│ ║
║ │ - Notification Sent │ ║
║ │ - Activity Log      │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Notify Organizer    │ ║
║ │ - Status Change     │ ║
║ │ - Updated Count     │ ║
║ │ - Meeting Viability │ ║
║ └─────────────────────┘ ║
╚═════════════════════════╝
  │
  ▼
◊─────────────────────────◊
│   All Responses In?     │
◊─────────────────────────◊
  │                    │
  │ Yes                │ No/Timeout
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Final Confirm   │  │ Send Reminders  │
│ - Meeting Valid │  │ - Follow Up     │
│ - Send Updates  │  │ - Status Check  │
│ - Set Reminders │  └─────────────────┘
└─────────────────┘         │
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Meeting Scheduled     │◄┘
│   - All Notifications   │
│   - Calendar Entries    │
│   - Reminder Set        │
└─────────────────────────┘
  │
  ▼
END
```

## 5. Security Audit & Monitoring Process

```
START
  │
  ▼
╔═════════════════════════╗
║   CONTINUOUS MONITORING ║
╠═════════════════════════╣
║ ┌─────────────────────┐ ║
║ │ System Activity     │ ║
║ │ Monitoring          │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Collect Events      │ ║
║ │ - User Actions      │ ║
║ │ - System Events     │ ║
║ │ - Error Logs        │ ║
║ │ - Performance Data  │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Event Analysis      │ ║
║ │ - Pattern Detection │ ║
║ │ - Anomaly Check     │ ║
║ │ - Threat Assessment │ ║
║ └─────────────────────┘ ║
║           │             ║
║           ▼             ║
║ ◊─────────────────────◊ ║
║ │ Security Alert?     │ ║
║ ◊─────────────────────◊ ║
║   │              │      ║
║   │ Yes          │ No   ║
║   ▼              ▼      ║
║ ┌─────────────┐ ┌─────┐ ║
║ │ Trigger     │ │ Log │ ║
║ │ Alert       │ │ Only│ ║
║ │ Process     │ └─────┘ ║
║ └─────────────┘        ║
║           │             ║
║           ▼             ║
║ ┌─────────────────────┐ ║
║ │ Security Response   │ ║
║ │ - Classify Threat   │ ║
║ │ - Immediate Action  │ ║
║ │ - Escalation        │ ║
║ └─────────────────────┘ ║
╚═════════════════════════╝
  │
  ▼
◊─────────────────────────◊
│   Threat Level?         │
◊─────────────────────────◊
 │        │        │
 │Low     │Medium  │High
 ▼        ▼        ▼
┌─────┐ ┌─────────┐ ┌──────────┐
│ Log │ │ Alert   │ │ Emergency│
│ Only│ │ Admin   │ │ Response │
└─────┘ └─────────┘ └──────────┘
 │        │              │
 ▼        ▼              ▼
┌─────────────────────────────┐
│     Response Actions        │
├─────────────────────────────┤
│ Low:                        │
│ - Log Event                 │
│ - Update Statistics         │
│ - Continue Monitoring       │
│                            │
│ Medium:                     │
│ - Send Admin Alert          │
│ - Increase Monitoring       │
│ - Review User Sessions      │
│ - Generate Report           │
│                            │
│ High:                       │
│ - Immediate Admin Alert     │
│ - Lock Affected Accounts    │
│ - Suspend Suspicious IPs    │
│ - Trigger Incident Response │
│ - Notify Security Team      │
│ - Emergency Audit           │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│   Audit Documentation   │
│   - Incident Report     │
│   - Action Taken        │
│   - Timeline            │
│   - Recovery Steps      │
└─────────────────────────┘
  │
  ▼
◊─────────────────────────◊
│   Incident Resolved?    │
◊─────────────────────────◊
  │                    │
  │ Yes                │ No
  ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ Close Incident  │  │ Escalate        │
│ - Final Report  │  │ - Senior Admin  │
│ - Lessons Learn │  │ - External Help │
│ - Update Policy │  │ - Emergency Proc│
└─────────────────┘  └─────────────────┘
  │                         │
  ▼                         │
┌─────────────────────────┐ │
│   Return to Monitoring  │◄┘
│   - Update Rules        │
│   - Enhanced Detection  │
│   - Improved Response   │
└─────────────────────────┘
  │
  ▼
 Continue Monitoring Loop
```

## Activity Diagram Symbols

### Basic Flow Elements
- **Start/End**: Rounded rectangles (START/END)
- **Activity**: Rectangles with activity description
- **Decision**: Diamond shapes with condition
- **Merge**: Diamond where flows rejoin
- **Fork/Join**: Thick horizontal lines for parallel activities

### Advanced Elements
- **Swimlanes**: Vertical sections showing different actors
- **Object Nodes**: Rectangles showing data/objects
- **Signals**: Sending and receiving external events
- **Time Events**: Activities triggered by time

### Special Notations
- **Parallel Activities**: Double-bordered rectangles
- **Exception Handling**: Lightning bolt symbols
- **Conditional Flow**: Guard conditions in brackets
- **Loop**: Circular arrows back to previous activities

## Process Quality Attributes

### 1. **Performance**
- File upload: Chunked processing for large files
- Real-time messaging: Sub-second delivery
- Scheduling: Instant conflict detection
- Security monitoring: Real-time threat detection

### 2. **Reliability**
- Upload resumption on failure
- Message delivery guarantees
- Meeting notification redundancy
- Security alert failover

### 3. **Security**
- Multi-layer validation
- Encryption at each step
- Audit trail maintenance
- Incident response automation

### 4. **Usability**
- Progressive disclosure
- Error recovery guidance
- Status feedback
- Accessibility compliance

### 5. **Scalability**
- Horizontal process scaling
- Load balancing
- Queue management
- Resource optimization
