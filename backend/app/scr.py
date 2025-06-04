import dns.resolver
import socket
import requests
import ssl
import json
from app.DNS import get_session, resolve_dns
import logging
from datetime import datetime
from typing import Dict, Any
import sys

# Configure colored output for Windows
if sys.platform == 'win32':
    import colorama
    colorama.init()

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def test_dns_resolution() -> Dict[str, Any]:
    """
    Test DNS resolution and OAuth endpoints
    Returns:
        Dict containing test results and endpoint configurations
    """
    print(f"\n{BLUE}{BOLD}Starting OAuth Configuration Tests{RESET}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        'dns_resolution': False,
        'https_connection': False,
        'openid_config': False,
        'endpoints': {}
    }
    
    # Test DNS resolution
    try:
        ip = resolve_dns('accounts.google.com')
        print(f"{GREEN}✓ DNS resolution successful:{RESET} {ip}")
        results['dns_resolution'] = True
        results['resolved_ip'] = ip
    except Exception as e:
        print(f"{RED}✗ DNS resolution failed:{RESET} {str(e)}")
        return results

    # Test HTTPS connection and validate response
    session = get_session()
    try:
        response = session.get(
            'https://accounts.google.com/.well-known/openid-configuration',
            verify=True,
            timeout=(5, 15)
        )
        response.raise_for_status()
        results['https_connection'] = True
        print(f"{GREEN}✓ HTTPS connection successful{RESET} (Status: {response.status_code})")
        
        # Parse and validate OpenID configuration
        config = response.json()
        required_fields = {
            'authorization_endpoint': 'Authorization',
            'token_endpoint': 'Token',
            'userinfo_endpoint': 'UserInfo'
        }
        
        print(f"\n{BLUE}{BOLD}OpenID Configuration Details:{RESET}")
        for field, name in required_fields.items():
            if field in config:
                print(f"{GREEN}✓ {name} Endpoint:{RESET} {config[field]}")
                results['endpoints'][field] = config[field]
            else:
                raise ValueError(f"Missing {name} endpoint")
        
        results['openid_config'] = True
        print(f"\n{GREEN}{BOLD}All tests completed successfully! ✓{RESET}")
        
    except requests.exceptions.RequestException as e:
        print(f"{RED}✗ HTTPS connection failed:{RESET} {str(e)}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"{RED}✗ Response validation failed:{RESET} {str(e)}")
    
    return results

if __name__ == '__main__':
    results = test_dns_resolution()
    
    # Print summary
    print(f"\n{BLUE}{BOLD}Test Summary:{RESET}")
    for test, passed in results.items():
        if test != 'endpoints':
            status = f"{GREEN}✓ Passed{RESET}" if passed else f"{RED}✗ Failed{RESET}"
            print(f"{test.replace('_', ' ').title()}: {status}")