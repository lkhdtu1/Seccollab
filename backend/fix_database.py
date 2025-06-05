#!/usr/bin/env python3
"""
Fix database schema by adding missing columns
"""

import sqlite3
import os

def check_and_fix_database():
    db_path = 'instance/app.db'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current users table structure
        cursor.execute('PRAGMA table_info(users)')
        columns = cursor.fetchall()
        
        print("Current users table columns:")
        existing_columns = []
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            existing_columns.append(col[1])
        
        # Check if is_active column exists
        if 'is_active' not in existing_columns:
            print("\n❌ Missing 'is_active' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1')
            print("✅ Added 'is_active' column")
        else:
            print("\n✅ 'is_active' column already exists")
          # Check if other commonly needed columns exist
        expected_columns = ['id', 'username', 'email', 'password_hash', 'is_active', 'created_at', 'updated_at', 'avatar_url', 'failed_login_attempts', 'last_login_attempt', 'account_locked_until', 'password_changed_at', 'last_active', 'session_token', 'daily_login_count', 'last_login_date']
        missing_columns = []
        
        for col in expected_columns:
            if col not in existing_columns:
                missing_columns.append(col)
        
        # Add missing columns one by one
        if 'avatar_url' not in existing_columns:
            print("\n❌ Missing 'avatar_url' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT')
            print("✅ Added 'avatar_url' column")
        
        if 'failed_login_attempts' not in existing_columns:
            print("\n❌ Missing 'failed_login_attempts' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0')
            print("✅ Added 'failed_login_attempts' column")
        
        if 'last_login_attempt' not in existing_columns:
            print("\n❌ Missing 'last_login_attempt' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN last_login_attempt TIMESTAMP')
            print("✅ Added 'last_login_attempt' column")
        
        if 'account_locked_until' not in existing_columns:
            print("\n❌ Missing 'account_locked_until' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP')
            print("✅ Added 'account_locked_until' column")
        
        if 'password_changed_at' not in existing_columns:
            print("\n❌ Missing 'password_changed_at' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP')
            print("✅ Added 'password_changed_at' column")
        
        if 'last_active' not in existing_columns:
            print("\n❌ Missing 'last_active' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN last_active TIMESTAMP')
            print("✅ Added 'last_active' column")
        
        if 'session_token' not in existing_columns:
            print("\n❌ Missing 'session_token' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN session_token TEXT')
            print("✅ Added 'session_token' column")
        
        if 'daily_login_count' not in existing_columns:
            print("\n❌ Missing 'daily_login_count' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN daily_login_count INTEGER DEFAULT 0')
            print("✅ Added 'daily_login_count' column")
        
        if 'last_login_date' not in existing_columns:
            print("\n❌ Missing 'last_login_date' column. Adding it...")
            cursor.execute('ALTER TABLE users ADD COLUMN last_login_date DATE')
            print("✅ Added 'last_login_date' column")
        
        if missing_columns:
            print(f"\n⚠️  Other potentially missing columns: {missing_columns}")
        
        conn.commit()
        print("\n✅ Database schema updated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == '__main__':
    check_and_fix_database()
