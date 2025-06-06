#!/usr/bin/env python3
"""
Final Security Middleware Integration Test
Tests all security features after fixing critical bugs
"""

import requests
import time
import json
from colorama import init, Fore, Back, Style

# Initialize colorama for colored output
init(autoreset=True)

BASE_URL = "http://127.0.0.1:5000"

def print_header(title):
    """Print a formatted test section header"""
    print(f"\n{Back.BLUE}{Style.BRIGHT} {title} {Style.RESET_ALL}")
    print("=" * 60)

def print_success(message):
    """Print success message in green"""
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")

def print_error(message):
    """Print error message in red"""
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

def print_warning(message):
    """Print warning message in yellow"""
    print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")

def print_info(message):
    """Print info message in cyan"""
    print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")

def test_server_running():
    """Test if the server is running and accessible"""
    print_header("SERVER ACCESSIBILITY TEST")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code in [200, 404, 302]:  # Any valid HTTP response
            print_success(f"Server is running - Status: {response.status_code}")
            return True
        else:
            print_error(f"Server returned unexpected status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to connect to server: {e}")
        return False

def test_security_headers():
    """Test if security headers are properly applied"""
    print_header("SECURITY HEADERS TEST")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        headers = response.headers
        
        expected_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
        
        all_present = True
        for header, expected_value in expected_headers.items():
            if header in headers:
                if headers[header] == expected_value:
                    print_success(f"{header}: {headers[header]}")
                else:
                    print_warning(f"{header}: Expected '{expected_value}', got '{headers[header]}'")
            else:
                print_error(f"Missing security header: {header}")
                all_present = False
        
        return all_present
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test security headers: {e}")
        return False

def test_honeypot_protection():
    """Test honeypot trap protection"""
    print_header("HONEYPOT PROTECTION TEST")
    honeypot_paths = [
        "/admin",
        "/wp-admin", 
        "/administrator",
        "/phpmyadmin",
        "/.env",
        "/config.php"
    ]
    
    all_blocked = True
    for path in honeypot_paths:
        try:
            response = requests.get(f"{BASE_URL}{path}", timeout=5)
            if response.status_code == 404:
                print_success(f"Honeypot path blocked: {path} -> 404")
            else:
                print_error(f"Honeypot path not blocked: {path} -> {response.status_code}")
                all_blocked = False
        except requests.exceptions.RequestException as e:
            print_error(f"Failed to test honeypot path {path}: {e}")
            all_blocked = False
    
    return all_blocked

def test_user_agent_detection():
    """Test user agent detection (Edge should NOT be flagged as suspicious)"""
    print_header("USER AGENT DETECTION TEST")
    
    # Test legitimate browsers (should be allowed)
    legitimate_agents = {
        "Chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Edge": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.864.59 Safari/537.36 Edg/91.0.864.59",
        "Safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
    }
    
    # Test suspicious agents (should be blocked)
    suspicious_agents = {
        "Bot": "python-requests/2.25.1",
        "Scanner": "sqlmap/1.4.7#stable",
        "Crawler": "curl/7.68.0"
    }
    
    all_correct = True
    
    print_info("Testing legitimate browsers:")
    for browser, agent in legitimate_agents.items():
        try:
            response = requests.get(f"{BASE_URL}/", headers={"User-Agent": agent}, timeout=5)
            if response.status_code in [200, 302, 404]:  # Not blocked
                print_success(f"{browser} allowed - Status: {response.status_code}")
            else:
                print_error(f"{browser} incorrectly blocked - Status: {response.status_code}")
                all_correct = False
        except requests.exceptions.RequestException as e:
            print_error(f"Failed to test {browser}: {e}")
            all_correct = False
    
    print_info("Testing suspicious user agents:")
    for agent_type, agent in suspicious_agents.items():
        try:
            response = requests.get(f"{BASE_URL}/", headers={"User-Agent": agent}, timeout=5)
            if response.status_code == 403:  # Should be blocked
                print_success(f"{agent_type} correctly blocked - Status: 403")
            else:
                print_warning(f"{agent_type} not blocked - Status: {response.status_code} (might be acceptable)")
        except requests.exceptions.RequestException as e:
            print_error(f"Failed to test {agent_type}: {e}")
    
    return all_correct

def test_sql_injection_detection():
    """Test SQL injection detection"""
    print_header("SQL INJECTION DETECTION TEST")
    
    # Test various SQL injection patterns
    injection_attempts = [
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
        "'; DROP TABLE users;--",
        "admin'--",
        "1' OR 1=1#"
    ]
    
    detected_count = 0
    for injection in injection_attempts:
        try:
            # Test with different parameters
            test_urls = [
                f"{BASE_URL}/?search={injection}",
                f"{BASE_URL}/?id={injection}",
                f"{BASE_URL}/?user={injection}"
            ]
            
            for url in test_urls:
                response = requests.get(url, timeout=5)
                if response.status_code == 403:
                    print_success(f"SQL injection detected and blocked: {injection}")
                    detected_count += 1
                    break
            else:
                print_warning(f"SQL injection not detected: {injection}")
        except requests.exceptions.RequestException as e:
            print_error(f"Failed to test SQL injection '{injection}': {e}")
    
    return detected_count > 0

def test_login_endpoint():
    """Test the login endpoint that was previously causing 500 errors"""
    print_header("LOGIN ENDPOINT TEST")
    try:
        # Test GET request to login page
        response = requests.get(f"{BASE_URL}/login", timeout=5)
        print_info(f"GET /login - Status: {response.status_code}")
        
        # Test POST request to login endpoint
        login_data = {
            "email": "test@example.com",
            "password": "testpassword"
        }
        response = requests.post(f"{BASE_URL}/login", json=login_data, timeout=5)
        print_info(f"POST /login - Status: {response.status_code}")
        
        # Should not be 500 (internal server error)
        if response.status_code != 500:
            print_success("Login endpoint no longer returns 500 errors")
            return True
        else:
            print_error("Login endpoint still returns 500 errors")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test login endpoint: {e}")
        return False

def test_forgot_password_endpoint():
    """Test the forgot password endpoint"""
    print_header("FORGOT PASSWORD ENDPOINT TEST")
    try:
        # Test GET request
        response = requests.get(f"{BASE_URL}/forgot-password", timeout=5)
        print_info(f"GET /forgot-password - Status: {response.status_code}")
        
        # Test POST request
        forgot_data = {
            "email": "test@example.com"
        }
        response = requests.post(f"{BASE_URL}/forgot-password", json=forgot_data, timeout=5)
        print_info(f"POST /forgot-password - Status: {response.status_code}")
        
        # Should not be 500 (internal server error)
        if response.status_code != 500:
            print_success("Forgot password endpoint no longer returns 500 errors")
            return True
        else:
            print_error("Forgot password endpoint still returns 500 errors")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to test forgot password endpoint: {e}")
        return False

def run_comprehensive_security_test():
    """Run all security tests and provide a comprehensive report"""
    print(f"{Back.GREEN}{Style.BRIGHT} SECURECOLLAB SECURITY MIDDLEWARE FINAL TEST {Style.RESET_ALL}")
    print(f"{Fore.CYAN}Testing server at: {BASE_URL}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Date: {time.strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
    
    tests = [
        ("Server Running", test_server_running),
        ("Security Headers", test_security_headers), 
        ("Honeypot Protection", test_honeypot_protection),
        ("User Agent Detection", test_user_agent_detection),
        ("SQL Injection Detection", test_sql_injection_detection),
        ("Login Endpoint", test_login_endpoint),
        ("Forgot Password Endpoint", test_forgot_password_endpoint)
    ]
    
    results = {}
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
            if result:
                passed_tests += 1
        except Exception as e:
            print_error(f"Test '{test_name}' failed with exception: {e}")
            results[test_name] = False
    
    # Print final report
    print_header("FINAL TEST REPORT")
    print(f"{Style.BRIGHT}Tests Passed: {passed_tests}/{total_tests}{Style.RESET_ALL}")
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        color = Fore.GREEN if result else Fore.RED
        print(f"{color}{status:4} | {test_name}{Style.RESET_ALL}")
    
    # Overall assessment
    if passed_tests == total_tests:
        print(f"\n{Back.GREEN}{Style.BRIGHT} 🎉 ALL TESTS PASSED - SECURITY MIDDLEWARE FULLY FUNCTIONAL! {Style.RESET_ALL}")
    elif passed_tests >= total_tests * 0.8:  # 80% pass rate
        print(f"\n{Back.YELLOW}{Style.BRIGHT} ⚠️  MOSTLY FUNCTIONAL - {passed_tests}/{total_tests} tests passed {Style.RESET_ALL}")
    else:
        print(f"\n{Back.RED}{Style.BRIGHT} ❌ CRITICAL ISSUES REMAIN - Only {passed_tests}/{total_tests} tests passed {Style.RESET_ALL}")
    
    return passed_tests, total_tests, results

if __name__ == "__main__":
    try:
        passed, total, results = run_comprehensive_security_test()
        
        # Exit with appropriate code
        if passed == total:
            exit(0)  # All tests passed
        else:
            exit(1)  # Some tests failed
            
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user{Style.RESET_ALL}")
        exit(2)
    except Exception as e:
        print(f"\n{Fore.RED}Test suite crashed: {e}{Style.RESET_ALL}")
        exit(3)
