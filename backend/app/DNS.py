import dns.resolver
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import logging
import socket

logger = logging.getLogger(__name__)

def create_session_with_retries():
    """Create requests session with retry strategy"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504, 429],
        allowed_methods=['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
    )
    
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=20,
        pool_maxsize=20
    )
    
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.timeout = (10, 30)
    
    return session

def setup_dns_resolver():
    """Configure custom DNS resolver"""
    resolver = dns.resolver.Resolver()
    
    # Use Google's DNS servers
    resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    # Set timeouts
    resolver.timeout = 3.0
    resolver.lifetime = 5.0
    
    return resolver