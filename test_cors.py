#!/usr/bin/env python3
"""
Test CORS configuration for SecureCollab Platform
"""

import requests
import json

def test_cors_configuration():
    """Test CORS preflight and actual requests"""
    print("🔧 Testing CORS Configuration...")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:5000"
    
    # Test 1: OPTIONS preflight request
    print("1️⃣ Testing OPTIONS preflight request...")
    try:
        response = requests.options(
            f"{base_url}/api/auth/register",
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,X-Content-Type-Options,Authorization'
            }
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        print(f"   Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'NOT SET')}")
        print(f"   Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
        
        if response.status_code == 200:
            print("   ✅ OPTIONS request successful")
        else:
            print("   ❌ OPTIONS request failed")
            
    except Exception as e:
        print(f"   ❌ OPTIONS request error: {e}")
    
    # Test 2: Actual POST request with problematic headers
    print("\n2️⃣ Testing POST request with X-Content-Type-Options header...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            headers={
                'Origin': 'http://localhost:3000',
                'Content-Type': 'application/json',
                'X-Content-Type-Options': 'nosniff'
            },
            json={
                "name": "CORS Test User",
                "email": "cors.test@example.com",
                "password": "TestPassword123!",
                "captcha_token": "test_token_bypass"
            }
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 201]:
            print("   ✅ POST request successful")
        else:
            print(f"   ❌ POST request failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ POST request error: {e}")

if __name__ == "__main__":
    test_cors_configuration()
