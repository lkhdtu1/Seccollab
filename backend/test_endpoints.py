#!/usr/bin/env python3
"""
Quick route test to see what endpoints are available on the server
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_available_endpoints():
    """Test various endpoints to see what's working"""
    
    print("Testing available endpoints...")
    
    # Test different endpoints that might exist
    endpoints_to_test = [
        "/",
        "/api/test",
        "/api/auth/login",
        "/api/users/profile",
        "/api/admin/stats",
        "/api/security/password-policy",
        "/api/schedules",
        "/health",
        "/status"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                timeout=3,
                headers={"User-Agent": "Mozilla/5.0 Test Client"}
            )
            print(f"GET {endpoint:<25} -> {response.status_code} ({len(response.text)} bytes)")
            
            # If we get a successful response, show some content
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"    Content: {json.dumps(data, indent=2)[:100]}...")
                except:
                    print(f"    Content: {response.text[:100]}...")
        except requests.exceptions.RequestException as e:
            print(f"GET {endpoint:<25} -> ERROR: {e}")
    
    print("\nDone!")

if __name__ == "__main__":
    test_available_endpoints()
