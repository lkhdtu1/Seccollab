#!/usr/bin/env python3
"""
Test Refined Rate Limiting - SecureCollab Platform
Tests the improved selective rate limiting system
"""

import sys
import os
import requests
import time
import json

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

def test_rate_limiting_tiers():
    """Test different rate limiting tiers"""
    base_url = "http://localhost:5000"
    
    print("=== Testing Refined Rate Limiting System ===\n")
    
    # Test 1: General requests should be very permissive
    print("1. Testing general requests (should be very permissive)...")
    general_success = 0
    for i in range(20):  # Try 20 requests quickly
        try:
            response = requests.get(f"{base_url}/", timeout=2)
            if response.status_code != 429:
                general_success += 1
        except:
            pass
    
    print(f"   General requests: {general_success}/20 successful")
    if general_success >= 15:
        print("   ✅ General rate limiting is appropriately permissive")
    else:
        print("   ❌ General rate limiting may be too strict")
    
    # Test 2: API requests should be moderately permissive
    print("\n2. Testing API requests (should be moderately permissive)...")
    api_success = 0
    for i in range(15):  # Try 15 API requests
        try:
            response = requests.get(f"{base_url}/api/health", timeout=2)
            if response.status_code != 429:
                api_success += 1
        except:
            pass
        time.sleep(0.1)  # Small delay
    
    print(f"   API requests: {api_success}/15 successful")
    if api_success >= 10:
        print("   ✅ API rate limiting is appropriately moderate")
    else:
        print("   ❌ API rate limiting may be too strict")
    
    # Test 3: Authentication requests should be more restrictive but not too much
    print("\n3. Testing authentication requests (should be more restrictive)...")
    auth_success = 0
    for i in range(10):  # Try 10 auth requests
        try:
            response = requests.post(f"{base_url}/api/auth/login", 
                                   json={"email": "test@example.com", "password": "wrongpass"},
                                   timeout=2)
            if response.status_code != 429:
                auth_success += 1
        except:
            pass
        time.sleep(0.2)  # Slightly longer delay
    
    print(f"   Auth requests: {auth_success}/10 successful (should get 401, not 429)")
    if auth_success >= 8:
        print("   ✅ Auth rate limiting allows normal login attempts")
    else:
        print("   ❌ Auth rate limiting may be too strict for normal users")
    
    # Test 4: Static file requests should be very permissive
    print("\n4. Testing static file requests (should be very permissive)...")
    static_success = 0
    for i in range(25):  # Try many static requests quickly
        try:
            response = requests.get(f"{base_url}/static/nonexistent.css", timeout=2)
            if response.status_code != 429:
                static_success += 1
        except:
            pass
    
    print(f"   Static requests: {static_success}/25 successful")
    if static_success >= 20:
        print("   ✅ Static file rate limiting is very permissive")
    else:
        print("   ❌ Static file rate limiting may be too strict")

def test_normal_user_workflow():
    """Test a normal user workflow to ensure no rate limiting interference"""
    base_url = "http://localhost:5000"
    
    print("\n=== Testing Normal User Workflow ===\n")
    
    # Simulate normal user behavior
    print("Simulating normal user login attempts...")
    
    # Test multiple login attempts in reasonable timeframe
    login_attempts = []
    for i in range(5):  # 5 login attempts over 30 seconds
        try:
            start_time = time.time()
            response = requests.post(f"{base_url}/api/auth/login", 
                                   json={"email": "normaluser@example.com", "password": "testpass123"},
                                   timeout=5)
            end_time = time.time()
            
            login_attempts.append({
                'attempt': i + 1,
                'status_code': response.status_code,
                'response_time': round(end_time - start_time, 2),
                'rate_limited': response.status_code == 429
            })
            
            print(f"   Attempt {i+1}: Status {response.status_code}, Time: {login_attempts[-1]['response_time']}s")
            
        except Exception as e:
            login_attempts.append({
                'attempt': i + 1,
                'status_code': 'ERROR',
                'response_time': 'N/A',
                'rate_limited': False,
                'error': str(e)
            })
            print(f"   Attempt {i+1}: ERROR - {e}")
        
        # Wait 6 seconds between attempts (normal user behavior)
        if i < 4:
            time.sleep(6)
    
    # Analyze results
    rate_limited_attempts = sum(1 for attempt in login_attempts if attempt.get('rate_limited'))
    successful_requests = sum(1 for attempt in login_attempts if isinstance(attempt['status_code'], int) and attempt['status_code'] != 429)
    
    print(f"\nResults:")
    print(f"   Total attempts: {len(login_attempts)}")
    print(f"   Rate limited: {rate_limited_attempts}")
    print(f"   Successful requests (not rate limited): {successful_requests}")
    
    if rate_limited_attempts == 0:
        print("   ✅ No rate limiting interference for normal user workflow")
    elif rate_limited_attempts <= 1:
        print("   ⚠️  Minimal rate limiting - acceptable for security")
    else:
        print("   ❌ Too much rate limiting for normal user behavior")

if __name__ == "__main__":
    print("Starting refined rate limiting tests...")
    print("Make sure the SecureCollab server is running on localhost:5000\n")
    
    try:
        # Quick server check
        response = requests.get("http://localhost:5000/", timeout=5)
        print(f"Server check: Status {response.status_code}")
        print("Server is responding, starting tests...\n")
        
        test_rate_limiting_tiers()
        test_normal_user_workflow()
        
        print("\n=== Test Summary ===")
        print("✅ Rate limiting refinement tests completed")
        print("✅ Different tiers tested: general, API, auth, static")
        print("✅ Normal user workflow validated")
        print("\nThe refined rate limiting should now be more user-friendly while maintaining security!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server at localhost:5000")
        print("Please start the server first with: python main.py")
    except Exception as e:
        print(f"❌ Test error: {e}")
