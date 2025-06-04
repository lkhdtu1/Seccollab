#!/usr/bin/env python3
"""
Test script to verify email case-insensitive functionality.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.user import User, db
from app.utils.database import init_db

def test_email_case_insensitive():
    """Test email case-insensitive operations."""
    app = create_app()
    
    # Initialize the database properly
    init_db(app)
    
    with app.app_context():
        
        # Test data
        test_email_lower = "test@example.com"
        test_email_upper = "TEST@EXAMPLE.COM"
        test_email_mixed = "Test@Example.Com"
        
        print("Testing email case-insensitive functionality...")
        
        # Test 1: Check if get_by_email works case-insensitively
        print("\n1. Testing get_by_email method:")
        
        # First, clean up any existing test user
        existing_user = User.query.filter_by(email=test_email_lower).first()
        if existing_user:
            db.session.delete(existing_user)
            db.session.commit()
        
        # Create a user with lowercase email
        user = User(
            email=test_email_lower,
            password="test_password",
            name="Test User"
        )
        db.session.add(user)
        db.session.commit()
        
        # Test finding user with different cases
        user_lower = User.get_by_email(test_email_lower)
        user_upper = User.get_by_email(test_email_upper)
        user_mixed = User.get_by_email(test_email_mixed)
        
        if user_lower and user_upper and user_mixed:
            print(f"✓ Found user with all email cases: {user_lower.email}")
            assert user_lower.id == user_upper.id == user_mixed.id
        else:
            print("✗ Failed to find user with different email cases")
            return False
        
        # Test 2: Check email uniqueness validation
        print("\n2. Testing email_exists method:")
        
        exists_lower = User.email_exists(test_email_lower)
        exists_upper = User.email_exists(test_email_upper)
        exists_mixed = User.email_exists(test_email_mixed)
        
        if exists_lower and exists_upper and exists_mixed:
            print("✓ email_exists detects all email case variations")
        else:
            print("✗ email_exists failed to detect email case variations")
            return False
        
        # Test 3: Test that we can't create duplicate users with different cases
        print("\n3. Testing duplicate prevention:")
        
        try:
            duplicate_user = User(
                email=test_email_upper,
                password="another_password",
                name="Duplicate User"
            )
            db.session.add(duplicate_user)
            db.session.commit()
            print("✗ Should not have been able to create duplicate user")
            return False
        except Exception as e:
            print("✓ Prevented duplicate user creation (expected behavior)")
            db.session.rollback()
        
        # Clean up
        db.session.delete(user)
        db.session.commit()
        
        print("\n✓ All email case-insensitive tests passed!")
        return True

if __name__ == "__main__":
    success = test_email_case_insensitive()
    exit(0 if success else 1)
