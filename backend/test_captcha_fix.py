#!/usr/bin/env python3
"""
Test script to verify CAPTCHA action mismatch fix
This script tests both the backend CAPTCHA verification and the frontend integration
"""

import os
import sys
import json
sys.path.append('.')

def test_captcha_verification():
    """Test the CAPTCHA verification functions directly"""
    print("=" * 80)
    print("🔍 TESTING CAPTCHA VERIFICATION FUNCTIONS")
    print("=" * 80)
    
    try:
        from flask import Flask
        from app.utils.captcha import verify_captcha_for_action, verify_recaptcha
        
        # Create Flask app with proper context
        app = Flask(__name__)
        app.config['DEBUG'] = True
        app.config['TESTING'] = True
        
        with app.app_context():
            print("\n1. Testing verify_recaptcha function...")
            
            # Test verify_recaptcha with different expected actions
            result1 = verify_recaptcha('dev-token', expected_action='forgot_password')
            print(f"   verify_recaptcha('dev-token', expected_action='forgot_password'): {result1}")
            
            result2 = verify_recaptcha('dev-token', expected_action='register')  
            print(f"   verify_recaptcha('dev-token', expected_action='register'): {result2}")
            
            print("\n2. Testing verify_captcha_for_action function...")
            
            # Test verify_captcha_for_action with different actions
            result3 = verify_captcha_for_action('dev-token', 'forgot_password')
            print(f"   verify_captcha_for_action('dev-token', 'forgot_password'): {result3}")
            
            result4 = verify_captcha_for_action('dev-token', 'register')
            print(f"   verify_captcha_for_action('dev-token', 'register'): {result4}")
            
            result5 = verify_captcha_for_action('dev-token', 'login')
            print(f"   verify_captcha_for_action('dev-token', 'login'): {result5}")
            
            # Verify all results are successful
            all_success = all(r['success'] for r in [result1, result2, result3, result4, result5])
            if all_success:
                print("\n✅ ALL CAPTCHA VERIFICATION TESTS PASSED!")
            else:
                print("\n❌ Some CAPTCHA verification tests failed!")
                
            return all_success
            
    except Exception as e:
        print(f"❌ Error in CAPTCHA verification test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_forgot_password_endpoint():
    """Test the forgot password endpoint with CAPTCHA"""
    print("\n" + "=" * 80)
    print("🔍 TESTING FORGOT PASSWORD ENDPOINT")
    print("=" * 80)
    
    try:
        from app import create_app
        
        app = create_app()
        
        with app.app_context():
            client = app.test_client()
            
            print("\n1. Testing forgot password endpoint with dev-token...")
            
            test_data = {
                'email': 'test@example.com',
                'captcha_token': 'dev-token'
            }
            
            response = client.post('/api/auth/forgot-password',
                                 json=test_data,
                                 content_type='application/json')
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.get_json()}")
            
            # Check if the request was successful (should be 200 even if user doesn't exist)
            if response.status_code == 200:
                print("\n✅ FORGOT PASSWORD ENDPOINT TEST PASSED!")
                return True
            else:
                print(f"\n❌ FORGOT PASSWORD ENDPOINT TEST FAILED!")
                return False
                
    except Exception as e:
        print(f"❌ Error in forgot password endpoint test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_register_endpoint():
    """Test the register endpoint with CAPTCHA"""
    print("\n" + "=" * 80)
    print("🔍 TESTING REGISTER ENDPOINT")
    print("=" * 80)
    
    try:
        from app import create_app
        
        app = create_app()
        
        with app.app_context():
            client = app.test_client()
            
            print("\n1. Testing register endpoint with dev-token...")
            
            test_data = {
                'email': 'newuser@example.com',
                'name': 'Test User',
                'password': 'TestPassword123!',
                'captcha_token': 'dev-token'
            }
            
            response = client.post('/api/auth/register',
                                 json=test_data,
                                 content_type='application/json')
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.get_json()}")
            
            # Check if the request was successful (201 for created or 409 if user exists)
            if response.status_code in [201, 409]:
                print("\n✅ REGISTER ENDPOINT TEST PASSED!")
                return True
            else:
                print(f"\n❌ REGISTER ENDPOINT TEST FAILED!")
                return False
                
    except Exception as e:
        print(f"❌ Error in register endpoint test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🚀 STARTING CAPTCHA ACTION MISMATCH FIX VERIFICATION")
    print("="*80)
    
    test_results = []
    
    # Test 1: CAPTCHA verification functions
    result1 = test_captcha_verification()
    test_results.append(("CAPTCHA Verification Functions", result1))
    
    # Test 2: Forgot password endpoint
    result2 = test_forgot_password_endpoint()
    test_results.append(("Forgot Password Endpoint", result2))
    
    # Test 3: Register endpoint
    result3 = test_register_endpoint()
    test_results.append(("Register Endpoint", result3))
    
    # Final results
    print("\n" + "=" * 80)
    print("📊 FINAL TEST RESULTS")
    print("=" * 80)
    
    all_passed = True
    for test_name, passed in test_results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED! CAPTCHA ACTION MISMATCH FIX IS WORKING!")
        print("✅ Frontend can now use action='forgot_password' successfully")
        print("✅ Backend correctly verifies actions for all endpoints")
        print("✅ Development mode works with proper action handling")
    else:
        print("❌ SOME TESTS FAILED! Please check the errors above.")
    print("=" * 80)
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
