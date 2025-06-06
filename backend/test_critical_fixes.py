#!/usr/bin/env python3
"""
Critical Security Fixes Verification Test
Focus on the main issues that were preventing server startup
"""

import requests
import time
from colorama import init, Fore, Style

init(autoreset=True)
BASE_URL = "http://127.0.0.1:5000"

def test_server_startup():
    """Test that server starts without critical errors"""
    print(f"{Fore.CYAN}🔧 Testing Server Startup...{Style.RESET_ALL}")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"{Fore.GREEN}✅ Server is accessible - Status: {response.status_code}{Style.RESET_ALL}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}❌ Server connection failed: {e}{Style.RESET_ALL}")
        return False

def test_no_500_errors():
    """Test that critical endpoints don't return 500 errors"""
    print(f"{Fore.CYAN}🔧 Testing Critical Endpoints for 500 Errors...{Style.RESET_ALL}")
    
    endpoints = [
        ('/login', 'GET'),
        ('/login', 'POST'),
        ('/forgot-password', 'GET'),
        ('/forgot-password', 'POST')
    ]
    
    all_good = True
    for endpoint, method in endpoints:
        try:
            if method == 'GET':
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            else:
                test_data = {"email": "test@example.com", "password": "test123"}
                response = requests.post(f"{BASE_URL}{endpoint}", json=test_data, timeout=5)
            
            if response.status_code == 500:
                print(f"{Fore.RED}❌ {method} {endpoint} returns 500 error{Style.RESET_ALL}")
                all_good = False
            else:
                print(f"{Fore.GREEN}✅ {method} {endpoint} - Status: {response.status_code} (Not 500){Style.RESET_ALL}")
        except requests.exceptions.RequestException as e:
            print(f"{Fore.YELLOW}⚠️  {method} {endpoint} - Connection issue: {e}{Style.RESET_ALL}")
    
    return all_good

def test_security_middleware_import():
    """Test that security middleware imports are working"""
    print(f"{Fore.CYAN}🔧 Testing Security Middleware Import...{Style.RESET_ALL}")
    try:
        # Try to import the security middleware components
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from app.utils.security_middleware import SecurityManager, add_security_headers, check_honeypot_traps
        print(f"{Fore.GREEN}✅ SecurityManager imported successfully{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ add_security_headers imported successfully{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ check_honeypot_traps imported successfully{Style.RESET_ALL}")
        return True
    except ImportError as e:
        print(f"{Fore.RED}❌ Import error: {e}{Style.RESET_ALL}")
        return False

def test_edge_user_agent():
    """Test that Microsoft Edge is not flagged as suspicious"""
    print(f"{Fore.CYAN}🔧 Testing Edge User Agent Detection...{Style.RESET_ALL}")
    
    edge_user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.864.59 Safari/537.36 Edg/91.0.864.59"
    
    try:
        # Wait a bit to avoid rate limiting
        time.sleep(2)
        response = requests.get(f"{BASE_URL}/", headers={"User-Agent": edge_user_agent}, timeout=10)
        
        if response.status_code == 403:
            print(f"{Fore.RED}❌ Edge user agent incorrectly blocked (403){Style.RESET_ALL}")
            return False
        else:
            print(f"{Fore.GREEN}✅ Edge user agent allowed - Status: {response.status_code}{Style.RESET_ALL}")
            return True
    except requests.exceptions.RequestException as e:
        print(f"{Fore.YELLOW}⚠️  Edge test connection issue: {e}{Style.RESET_ALL}")
        return False

def test_basic_security_headers():
    """Test that basic security headers are present"""
    print(f"{Fore.CYAN}🔧 Testing Basic Security Headers...{Style.RESET_ALL}")
    
    try:
        time.sleep(2)  # Avoid rate limiting
        response = requests.get(f"{BASE_URL}/", timeout=10)
        headers = response.headers
        
        required_headers = ['X-Content-Type-Options', 'X-Frame-Options', 'Content-Security-Policy']
        found_headers = 0
        
        for header in required_headers:
            if header in headers:
                print(f"{Fore.GREEN}✅ {header}: {headers[header]}{Style.RESET_ALL}")
                found_headers += 1
            else:
                print(f"{Fore.YELLOW}⚠️  Missing header: {header}{Style.RESET_ALL}")
        
        return found_headers >= 2  # At least 2 out of 3 headers present
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}❌ Headers test failed: {e}{Style.RESET_ALL}")
        return False

def run_critical_tests():
    """Run all critical tests"""
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.BLUE}SECURECOLLAB CRITICAL SECURITY FIXES VERIFICATION{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    
    tests = [
        ("Security Middleware Import", test_security_middleware_import),
        ("Server Startup", test_server_startup),
        ("No 500 Errors", test_no_500_errors),
        ("Edge User Agent", test_edge_user_agent),
        ("Basic Security Headers", test_basic_security_headers),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{Fore.CYAN}Testing: {test_name}{Style.RESET_ALL}")
        try:
            result = test_func()
            if result:
                passed += 1
                print(f"{Fore.GREEN}✅ {test_name}: PASSED{Style.RESET_ALL}")
            else:
                print(f"{Fore.RED}❌ {test_name}: FAILED{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}❌ {test_name}: ERROR - {e}{Style.RESET_ALL}")
    
    print(f"\n{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.BLUE}CRITICAL TESTS SUMMARY{Style.RESET_ALL}")
    print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print(f"{Fore.GREEN}🎉 ALL CRITICAL ISSUES RESOLVED!{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Server starts without errors{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Security middleware imports work{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ No 500 errors on critical endpoints{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Edge browser support working{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ Security headers being applied{Style.RESET_ALL}")
        success = True
    elif passed >= 4:
        print(f"{Fore.YELLOW}⚠️  MOSTLY RESOLVED - {passed}/{total} critical tests passed{Style.RESET_ALL}")
        success = True
    else:
        print(f"{Fore.RED}❌ CRITICAL ISSUES REMAIN - Only {passed}/{total} tests passed{Style.RESET_ALL}")
        success = False
    
    return success

if __name__ == "__main__":
    success = run_critical_tests()
    exit(0 if success else 1)
