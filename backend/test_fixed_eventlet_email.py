#!/usr/bin/env python3
"""
Test the fixed eventlet-compatible email utility to verify it works in all contexts.
"""
import sys
import os
sys.path.append('.')

import time

def test_fixed_eventlet_email():
    """Test the new fixed eventlet-compatible email utility"""
    print("=" * 80)
    print("TESTING FIXED EVENTLET-COMPATIBLE EMAIL UTILITY")
    print("=" * 80)
    
    # Test 1: Before eventlet (should use original methods)
    print("\n1. Testing before eventlet monkey patching...")
    try:
        from app.utils.EmailEventletFixed import send_email_with_local_fallback
        result1 = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test Before Eventlet (Fixed)",
            body="Testing fixed email utility before eventlet.",
            timeout=8
        )
        print(f"✓ Result: {result1}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result1 = False
    
    print("\nWaiting 3 seconds...")
    time.sleep(3)
    
    # Test 2: After eventlet (should auto-detect and use eventlet methods)
    print("\n2. Testing after eventlet monkey patching...")
    try:
        import eventlet
        eventlet.monkey_patch(socket=True, select=True)
        print("Applied eventlet monkey patching...")
        
        from app.utils.EmailEventletFixed import send_email_with_local_fallback
        result2 = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test After Eventlet (Fixed)",
            body="Testing fixed email utility after eventlet.",
            timeout=8
        )
        print(f"✓ Result: {result2}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result2 = False
    
    print("\nWaiting 3 seconds...")
    time.sleep(3)
    
    # Test 3: Within Flask context (should work with eventlet)
    print("\n3. Testing within Flask application context...")
    try:
        from app import create_app
        from app.config.config import Config
        
        app = create_app(Config)
        
        with app.app_context():
            from app.utils.EmailEventletFixed import send_email_with_local_fallback
            result3 = send_email_with_local_fallback(
                to="nonexistent@test.com",
                subject="Test Flask Context (Fixed)",
                body="Testing fixed email utility within Flask context.",
                timeout=8
            )
            print(f"✓ Result: {result3}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result3 = False
    
    # Summary
    print("\n" + "=" * 80)
    print("FIXED EVENTLET-COMPATIBLE EMAIL UTILITY TEST RESULTS")
    print("=" * 80)
    print(f"Before Eventlet:     {'✓ PASS' if result1 else '✗ FAIL'}")
    print(f"After Eventlet:      {'✓ PASS' if result2 else '✗ FAIL'}")
    print(f"Flask Context:       {'✓ PASS' if result3 else '✗ FAIL'}")
    
    if all([result1, result2, result3]):
        print("\n🎉 ALL TESTS PASSED! The fixed eventlet-compatible email utility works in all contexts!")
        print("✅ Email timeout issue in Flask application has been RESOLVED!")
        return True
    elif result1 and not result2:
        print(f"\n⚠️ Eventlet still causing issues. Need different approach.")
        return False
    elif result1 and result2 and not result3:
        print(f"\n⚠️ Flask context still has issues. Need Flask-specific fix.")
        return False
    else:
        print(f"\n⚠️ Multiple issues detected. Need comprehensive investigation.")
        return False

if __name__ == "__main__":
    test_fixed_eventlet_email()
