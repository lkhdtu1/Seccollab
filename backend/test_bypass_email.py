#!/usr/bin/env python3
"""
Test the bypass email utility that completely avoids eventlet interference.
"""
import sys
import os
sys.path.append('.')

import time

def test_bypass_email():
    """Test the bypass email utility"""
    print("=" * 80)
    print("TESTING BYPASS EMAIL UTILITY (EVENTLET-PROOF)")
    print("=" * 80)
    
    # Test 1: Before eventlet (should use original methods)
    print("\n1. Testing before eventlet monkey patching...")
    try:
        from app.utils.EmailBypass import send_email_with_local_fallback
        result1 = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test Before Eventlet (Bypass)",
            body="Testing bypass email utility before eventlet.",
            timeout=15
        )
        print(f"✓ Result: {result1}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result1 = False
    
    print("\nWaiting 5 seconds...")
    time.sleep(5)
    
    # Test 2: After eventlet (should auto-detect and use bypass methods)
    print("\n2. Testing after eventlet monkey patching...")
    try:
        import eventlet
        eventlet.monkey_patch(socket=True, select=True)
        print("Applied eventlet monkey patching...")
        
        from app.utils.EmailBypass import send_email_with_local_fallback
        result2 = send_email_with_local_fallback(
            to="nonexistent@test.com",
            subject="Test After Eventlet (Bypass)",
            body="Testing bypass email utility after eventlet.",
            timeout=15
        )
        print(f"✓ Result: {result2}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result2 = False
    
    print("\nWaiting 5 seconds...")
    time.sleep(5)
    
    # Test 3: Within Flask context (should work with eventlet bypass)
    print("\n3. Testing within Flask application context...")
    try:
        from app import create_app
        from app.config.config import Config
        
        app = create_app(Config)
        
        with app.app_context():
            from app.utils.EmailBypass import send_email_with_local_fallback
            result3 = send_email_with_local_fallback(
                to="nonexistent@test.com",
                subject="Test Flask Context (Bypass)",
                body="Testing bypass email utility within Flask context.",
                timeout=15
            )
            print(f"✓ Result: {result3}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        result3 = False
    
    # Summary
    print("\n" + "=" * 80)
    print("BYPASS EMAIL UTILITY TEST RESULTS")
    print("=" * 80)
    print(f"Before Eventlet:     {'✓ PASS' if result1 else '✗ FAIL'}")
    print(f"After Eventlet:      {'✓ PASS' if result2 else '✗ FAIL'}")
    print(f"Flask Context:       {'✓ PASS' if result3 else '✗ FAIL'}")
    
    if all([result1, result2, result3]):
        print("\n🎉 ALL TESTS PASSED! The bypass email utility works in all contexts!")
        print("✅ Email timeout issue in Flask application has been COMPLETELY RESOLVED!")
        print("🔧 The solution uses subprocess/multiprocessing to bypass eventlet interference.")
        return True
    elif result1 and result2 and not result3:
        print(f"\n🔧 Eventlet bypass works, but Flask context still has issues.")
        print("    This suggests additional Flask configuration conflicts.")
        return False
    elif result1 and not result2:
        print(f"\n⚠️ Eventlet bypass methods are not working properly.")
        print("    May need system-level debugging.")
        return False
    else:
        print(f"\n⚠️ Multiple issues detected. Need comprehensive investigation.")
        return False

if __name__ == "__main__":
    test_bypass_email()
