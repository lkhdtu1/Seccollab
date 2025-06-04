"""
Database migration script to add missing columns to existing database
"""
import sqlite3
import os
from datetime import datetime

def migrate_database():
    # Path to the database
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'app.db')
    
    if not os.path.exists(db_path):
        print("Database does not exist. Please run create_db.py first.")
        return
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Running database migrations...")
    
    # Check which columns exist in users table
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [column[1] for column in cursor.fetchall()]
    print(f"Existing columns in users table: {existing_columns}")
    
    # List of columns that should exist in the users table
    required_columns = [
        ('is_active', 'BOOLEAN DEFAULT 1'),
        ('avatar_url', 'TEXT'),
        ('failed_login_attempts', 'INTEGER DEFAULT 0'),
        ('last_login_attempt', 'TIMESTAMP'),
        ('account_locked_until', 'TIMESTAMP'),
        ('password_changed_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
        ('last_active', 'TIMESTAMP'),
        ('session_token', 'TEXT'),
        ('daily_login_count', 'INTEGER DEFAULT 0'),
        ('last_login_date', 'DATE')
    ]
    
    # Add missing columns
    for column_name, column_definition in required_columns:
        if column_name not in existing_columns:
            try:
                alter_sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_definition}"
                cursor.execute(alter_sql)
                print(f"Added column: {column_name}")
            except sqlite3.OperationalError as e:
                print(f"Failed to add column {column_name}: {e}")
    
    # Create missing tables if they don't exist
    
    # Create trusted_devices table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS trusted_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_fingerprint TEXT NOT NULL,
        device_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create schedules table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )
    ''')
    
    # Create schedule_participants table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create schedule_notifications table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        notification_time TIMESTAMP NOT NULL,
        sent BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create activities table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        room_id TEXT,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
    )
    ''')
    
    # Create chat table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        room TEXT DEFAULT 'general',
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create active_user table (note: different from active_users)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS active_user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'online',
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate_database()
