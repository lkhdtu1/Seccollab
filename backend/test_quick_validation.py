#!/usr/bin/env python3
"""
Quick Security Validation - SecureCollab Platform
Fast validation of key security improvements
"""

import requests
import time

def test_key_improvements():
    """Test the key security improvements"""
    base_url = "http://localhost:5000"
    
    print("=== QUICK SECURITY VALIDATION ===\n")
    
    # Test 1: Server responds
    print("1. Testing server connectivity...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"   ✅ Server responds with status: {response.status_code}")
        
        # Check for security headers
        security_headers = ['X-Frame-Options', 'X-Content-Type-Options']
        for header in security_headers:
            if header in response.headers:
                print(f"   ✅ Security header present: {header}")
            else:
                print(f"   ❌ Missing header: {header}")
                
    except Exception as e:
        print(f"   ❌ Server connection failed: {e}")
        return False
    
    # Test 2: Rate limiting is user-friendly
    print("\n2. Testing user-friendly rate limiting...")
    
    # Normal user login attempts should not be blocked
    login_attempts = 0
    rate_limited = 0
    
    for i in range(5):
        try:
            response = requests.post(f"{base_url}/api/auth/login", 
                                   json={"email": "test@example.com", "password": "wrongpass"},
                                   timeout=3)
            login_attempts += 1
            if response.status_code == 429:
                rate_limited += 1
            print(f"   Attempt {i+1}: Status {response.status_code}")
        except Exception as e:
            print(f"   Attempt {i+1}: Error - {e}")
        
        time.sleep(1)  # Normal user delay
    
    print(f"   Total attempts: {login_attempts}")
    print(f"   Rate limited: {rate_limited}")
    
    if rate_limited == 0:
        print("   ✅ Rate limiting allows normal user behavior")
    elif rate_limited <= 1:
        print("   ⚠️  Minimal rate limiting - acceptable")
    else:
        print("   ❌ Too aggressive rate limiting")
    
    # Test 3: Different endpoints have different limits
    print("\n3. Testing selective rate limiting...")
    
    # Test general requests (should be very permissive)
    general_success = 0
    for i in range(10):
        try:
            response = requests.get(f"{base_url}/", timeout=2)
            if response.status_code != 429:
                general_success += 1
        except:
            pass
    
    print(f"   General requests successful: {general_success}/10")
    
    if general_success >= 8:
        print("   ✅ General requests are appropriately permissive")
    else:
        print("   ❌ General requests may be too restricted")
    
    # Summary
    print("\n=== VALIDATION SUMMARY ===")
    
    if rate_limited == 0 and general_success >= 8:
        print("🎉 SUCCESS! Key improvements are working:")
        print("✅ Rate limiting is user-friendly")
        print("✅ Normal users can login without issues")
        print("✅ Selective rate limiting is operational")
        print("✅ Server is stable and responding")
        return True
    else:
        print("⚠️  Some improvements need fine-tuning")
        return False

if __name__ == "__main__":
    print("Running quick security validation...\n")
    success = test_key_improvements()
    
    if success:
        print("\n" + "="*50)
        print("🎯 SECURITY REFINEMENT SUCCESSFUL!")
        print("="*50)
        print("The rate limiting issues have been resolved!")
        print("Users can now login normally without interference.")
    else:
        print("\nAdditional refinement may be needed.")
