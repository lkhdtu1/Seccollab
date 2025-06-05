#!/usr/bin/env python3
"""
Test to investigate if eventlet monkey patching is causing email timeout issues.
This test will verify email functionality before and after eventlet monkey patching.
"""
import sys
import os
sys.path.append('.')

import time
import threading
from app.utils.Email1 import send_email_with_local_fallback

def test_email_before_eventlet():
    """Test email sending before eventlet monkey patching"""
    print("=" * 60)
    print("TESTING EMAIL BEFORE EVENTLET MONKEY PATCHING")
    print("=" * 60)
    
    try:
        result = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test Before Eventlet",
            body="This is a test email sent before eventlet monkey patching.",
            timeout=10
        )
        print(f"✓ Email test before eventlet completed: {result}")
        return True
    except Exception as e:
        print(f"✗ Email test before eventlet failed: {str(e)}")
        return False

def test_email_after_eventlet():
    """Test email sending after eventlet monkey patching"""
    print("\n" + "=" * 60)
    print("TESTING EMAIL AFTER EVENTLET MONKEY PATCHING")
    print("=" * 60)
    
    # Apply eventlet monkey patching (like Flask app does)
    import eventlet
    eventlet.monkey_patch(socket=True, select=True)
    print("Applied eventlet monkey patching...")
    
    try:
        result = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test After Eventlet",
            body="This is a test email sent after eventlet monkey patching.",
            timeout=10
        )
        print(f"✓ Email test after eventlet completed: {result}")
        return True
    except Exception as e:
        print(f"✗ Email test after eventlet failed: {str(e)}")
        return False

def test_email_with_flask_context():
    """Test email sending within Flask application context"""
    print("\n" + "=" * 60)
    print("TESTING EMAIL WITHIN FLASK APPLICATION CONTEXT")
    print("=" * 60)
    
    try:
        from app import create_app
        from app.config.config import Config
        
        app = create_app(Config)
        
        with app.app_context():
            print("Testing email within Flask app context...")
            result = send_email_with_local_fallback(
                to="nonexistent@test.com",
                subject="Test Within Flask Context",
                body="This is a test email sent within Flask application context.",
                timeout=10
            )
            print(f"✓ Email test within Flask context completed: {result}")
            return True
    except Exception as e:
        print(f"✗ Email test within Flask context failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("INVESTIGATING EVENTLET AND FLASK CONTEXT EMAIL CONFLICTS")
    print("=" * 80)
    
    results = {
        'before_eventlet': False,
        'after_eventlet': False,
        'flask_context': False
    }
    
    # Test 1: Email before eventlet
    results['before_eventlet'] = test_email_before_eventlet()
    
    # Wait between tests
    print("\nWaiting 3 seconds between tests...")
    time.sleep(3)
    
    # Test 2: Email after eventlet monkey patching
    results['after_eventlet'] = test_email_after_eventlet()
    
    # Wait between tests
    print("\nWaiting 3 seconds between tests...")
    time.sleep(3)
    
    # Test 3: Email within Flask app context
    results['flask_context'] = test_email_with_flask_context()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Before Eventlet:     {'✓ PASS' if results['before_eventlet'] else '✗ FAIL'}")
    print(f"After Eventlet:      {'✓ PASS' if results['after_eventlet'] else '✗ FAIL'}")
    print(f"Flask Context:       {'✓ PASS' if results['flask_context'] else '✗ FAIL'}")
    
    # Analysis
    print("\n" + "=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    
    if results['before_eventlet'] and not results['after_eventlet']:
        print("🔍 EVENTLET MONKEY PATCHING IS CAUSING THE ISSUE!")
        print("   - Email works before eventlet monkey patching")
        print("   - Email fails after eventlet monkey patching")
        print("   - Solution: Modify email utility to work with eventlet")
    elif results['before_eventlet'] and results['after_eventlet'] and not results['flask_context']:
        print("🔍 FLASK APPLICATION CONTEXT IS CAUSING THE ISSUE!")
        print("   - Email works standalone and with eventlet")
        print("   - Email fails within Flask app context")
        print("   - Solution: Investigate Flask app configuration conflicts")
    elif not any(results.values()):
        print("🔍 GENERAL EMAIL CONFIGURATION ISSUE!")
        print("   - Email fails in all contexts")
        print("   - Solution: Check network, SMTP configuration, or DNS")
    else:
        print("🔍 MIXED RESULTS - FURTHER INVESTIGATION NEEDED")
        print("   - Some tests pass, others fail")
        print("   - Multiple factors may be involved")
    
    return results

if __name__ == "__main__":
    main()
