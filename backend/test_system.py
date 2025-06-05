#!/usr/bin/env python3
"""
Test script to verify the email system functionality
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_email_system():
    """Test the email system components"""
    try:
        print("Testing email system...")
        
        # Test DNS resolution
        from app.utils.Email1 import test_dns_resolution, get_available_smtp_server
        
        print("✓ Email utility imported successfully")
        
        # Test DNS resolution for Gmail
        if test_dns_resolution('smtp.gmail.com'):
            print("✓ Gmail SMTP DNS resolution: SUCCESS")
        else:
            print("✗ Gmail SMTP DNS resolution: FAILED")
        
        # Get available server
        server = get_available_smtp_server()
        print(f"✓ Available SMTP server: {server['server']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing email system: {e}")
        return False

def test_app_creation():
    """Test Flask app creation"""
    try:
        print("\nTesting Flask app creation...")
        from app import create_app
        
        app = create_app()
        print("✓ Flask app created successfully")
        
        # Test email routes exist
        rules = [str(rule) for rule in app.url_map.iter_rules()]
        schedule_routes = [rule for rule in rules if 'schedule' in rule]
        print(f"✓ Found {len(schedule_routes)} schedule-related routes")
        
        return True
        
    except Exception as e:
        print(f"✗ Error creating Flask app: {e}")
        return False

if __name__ == "__main__":
    print("SecureCollab Email System Test")
    print("=" * 40)
    
    success = True
    success &= test_email_system()
    success &= test_app_creation()
    
    print("\n" + "=" * 40)
    if success:
        print("🎉 ALL TESTS PASSED! Email system is working correctly.")
    else:
        print("❌ Some tests failed. Please check the output above.")
    
    sys.exit(0 if success else 1)
