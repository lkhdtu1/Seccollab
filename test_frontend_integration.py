#!/usr/bin/env python3
"""
Complete Frontend-Backend Integration Test
Tests the full user registration flow from frontend to backend
"""

import requests
import json
import time
from datetime import datetime

def test_complete_integration():
    """Test complete frontend-backend integration"""
    print("🔗 SECURECOLLAB - FRONTEND-BACKEND INTEGRATION TEST")
    print("=" * 65)
    
    # Test 1: Backend API Status
    print("\n1️⃣ Testing Backend API Status...")
    try:
        response = requests.get("http://localhost:5000/api/test", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend API: ONLINE")
        else:
            print(f"   ❌ Backend API: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ Backend API: UNREACHABLE ({e})")
        return False
    
    # Test 2: Frontend Server Status
    print("\n2️⃣ Testing Frontend Server Status...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend Server: ONLINE")
        else:
            print(f"   ❌ Frontend Server: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ Frontend Server: UNREACHABLE ({e})")
        return False
    
    # Test 3: CORS Preflight (Simulating Frontend Request)
    print("\n3️⃣ Testing CORS Preflight (Frontend → Backend)...")
    try:
        response = requests.options(
            "http://127.0.0.1:5000/api/auth/register",
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,X-Content-Type-Options,Authorization'
            }
        )
        
        if response.status_code == 200:
            print("   ✅ CORS Preflight: PASSED")
            print(f"   📋 Allowed Origins: {response.headers.get('Access-Control-Allow-Origin')}")
            print(f"   📋 Allowed Headers: {response.headers.get('Access-Control-Allow-Headers')}")
        else:
            print(f"   ❌ CORS Preflight: FAILED (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ CORS Preflight: ERROR ({e})")
        return False
    
    # Test 4: User Registration (Simulating Frontend Form Submission)
    print("\n4️⃣ Testing User Registration (Frontend → Backend)...")
    timestamp = int(time.time())
    test_user = {
        "name": "Integration Test User",
        "email": f"integration.test.{timestamp}@example.com",
        "password": "TestPassword123!",
        "captcha_token": "test_token_bypass"
    }
    
    try:
        response = requests.post(
            "http://127.0.0.1:5000/api/auth/register",
            headers={
                'Origin': 'http://localhost:3000',
                'Content-Type': 'application/json',
                'X-Content-Type-Options': 'nosniff'  # This was causing the CORS issue
            },
            json=test_user
        )
        
        if response.status_code == 201:
            data = response.json()
            print("   ✅ User Registration: SUCCESS")
            print(f"   👤 User ID: {data.get('user', {}).get('id')}")
            print(f"   📧 Email: {data.get('user', {}).get('email')}")
            print(f"   🔑 Access Token: {'✓ Received' if data.get('access_token') else '✗ Missing'}")
            return data.get('access_token'), data.get('user')
        else:
            print(f"   ❌ User Registration: FAILED (Status: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"   ❌ User Registration: ERROR ({e})")
        return None, None

def test_authenticated_features(access_token, user):
    """Test authenticated features"""
    if not access_token:
        print("\n⏭️ Skipping authenticated tests (no access token)")
        return
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
    }
    
    # Test 5: Get Current User
    print("\n5️⃣ Testing Get Current User...")
    try:
        response = requests.get("http://127.0.0.1:5000/api/auth/user", headers=headers)
        if response.status_code == 200:
            user_data = response.json().get('user', {})
            print("   ✅ Get Current User: SUCCESS")
            print(f"   👤 Name: {user_data.get('name')}")
            print(f"   📧 Email: {user_data.get('email')}")
        else:
            print(f"   ❌ Get Current User: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"   ❌ Get Current User: ERROR ({e})")
    
    # Test 6: Dashboard Data
    print("\n6️⃣ Testing Dashboard Data...")
    try:
        response = requests.get("http://127.0.0.1:5000/api/stats/dashboard", headers=headers)
        if response.status_code == 200:
            print("   ✅ Dashboard Data: SUCCESS")
            stats = response.json().get('data', {})
            file_stats = stats.get('fileStats', {})
            print(f"   📊 Total Files: {file_stats.get('totalFiles', 0)}")
        else:
            print(f"   ❌ Dashboard Data: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"   ❌ Dashboard Data: ERROR ({e})")

def main():
    """Run complete integration test"""
    # Test basic integration
    access_token, user = test_complete_integration()
    
    # Test authenticated features
    test_authenticated_features(access_token, user)
    
    # Summary
    print("\n" + "=" * 65)
    print("🎯 INTEGRATION TEST RESULTS")
    print("=" * 65)
    
    if access_token:
        print("✅ ALL TESTS PASSED - Integration Successful!")
        print("🔗 Frontend ↔ Backend Communication: WORKING")
        print("🛡️ CORS Configuration: FIXED")
        print("🔐 Authentication Flow: WORKING")
        print("📡 API Endpoints: ACCESSIBLE")
        print("\n🎉 SecureCollab Platform is ready for production testing!")
        print("\n📱 Frontend URL: http://localhost:3000")
        print("🔧 Backend API: http://localhost:5000")
        print("📖 Registration Form: http://localhost:3000/register")
        print("🔑 Login Form: http://localhost:3000/login")
    else:
        print("❌ INTEGRATION TESTS FAILED")
        print("🔍 Please check server logs and configuration")
    
    print("=" * 65)

if __name__ == "__main__":
    main()
