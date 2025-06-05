import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import time
import socket
import threading
from typing import List, Dict, Tuple
import eventlet
from eventlet.green import socket as green_socket, time as green_time
import ssl

# Multiple SMTP server configurations for fallback
SMTP_SERVERS = [
    {
        'server': 'smtp.gmail.com',
        'port': 587,
        'use_tls': True,
        'priority': 1
    },
    {
        'server': 'smtp-mail.outlook.com',
        'port': 587,
        'use_tls': True,
        'priority': 2
    },
    {
        'server': 'smtp.mail.yahoo.com',
        'port': 587,
        'use_tls': True,
        'priority': 3
    }
]

def is_eventlet_patched():
    """Check if eventlet has monkey patched the socket module"""
    try:
        import eventlet.patcher
        is_patched = eventlet.patcher.is_monkey_patched('socket')
        print(f"Eventlet patcher detection: {is_patched}")
        return is_patched
    except (ImportError, AttributeError):
        # Fallback detection methods
        fallback_checks = [
            hasattr(socket.socket, '_green'),
            hasattr(socket, '_original_socket'),
            'eventlet' in str(type(socket.socket)),
            'green' in str(type(socket.socket)).lower()
        ]
        print(f"Eventlet fallback checks: {fallback_checks}")
        print(f"Socket type: {type(socket.socket)}")
        return any(fallback_checks)

def test_dns_resolution_eventlet(hostname: str, timeout: int = 5) -> bool:
    """Test DNS resolution using eventlet-compatible methods"""
    try:
        if is_eventlet_patched():
            # Use eventlet's DNS resolution with timeout
            with eventlet.Timeout(timeout):
                green_socket.gethostbyname(hostname)
        else:
            # Use standard socket resolution
            old_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(timeout)
            try:
                socket.gethostbyname(hostname)
            finally:
                socket.setdefaulttimeout(old_timeout)
        return True
    except (socket.gaierror, eventlet.Timeout, socket.timeout, OSError):
        return False

def get_available_smtp_server_eventlet() -> Dict:
    """Find the first available SMTP server using eventlet-compatible DNS testing"""
    print(f"Testing DNS resolution for {len(SMTP_SERVERS)} SMTP servers (eventlet-aware)...")
    
    for i, server_config in enumerate(SMTP_SERVERS):
        server_name = server_config['server']
        print(f"Testing server {i+1}/{len(SMTP_SERVERS)}: {server_name}")
        
        if test_dns_resolution_eventlet(server_name):
            print(f"✓ DNS resolution successful for {server_name}")
            return server_config
        else:
            print(f"✗ DNS resolution failed for {server_name}")
    
    # If no server resolves, return the first one as fallback
    print("⚠ No SMTP servers resolved successfully, using first server as fallback")
    return SMTP_SERVERS[0]

def send_email_eventlet(to: str, subject: str, body: str, max_retries: int = 3, timeout: int = 30):
    """
    Send email with eventlet-compatible networking and retry logic
    
    Args:
        to: Recipient email address
        subject: Email subject
        body: Email body content
        max_retries: Maximum number of retry attempts
        timeout: Timeout in seconds for network operations
    """
    if not isinstance(subject, str):
        raise ValueError("Le sujet (subject) doit être une chaîne de caractères")

    # Get SMTP configuration from environment or use defaults
    smtp_username = os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')
    smtp_password = os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')

    # Start with the first server and cycle through all servers
    current_server_index = 0
    servers_tried = set()  # Track which servers we've tried to avoid infinite loops
    
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    last_error = None
    
    for attempt in range(max_retries):
        # Get current server configuration
        server_config = SMTP_SERVERS[current_server_index]
        smtp_server = server_config['server']
        smtp_port = server_config['port']
        current_timeout = timeout if attempt == 0 else max(10, timeout - (attempt * 5))
        
        try:
            print(f"Attempting to send email to {to} (attempt {attempt + 1}/{max_retries}) via {smtp_server}:{smtp_port} (timeout: {current_timeout}s)")
            
            if is_eventlet_patched():
                # For eventlet, we need to be more careful about DNS resolution
                # First, try to resolve the hostname with a shorter timeout
                try:
                    with eventlet.Timeout(5):  # 5 second DNS timeout
                        green_socket.gethostbyname(smtp_server)
                except (eventlet.Timeout, Exception) as dns_error:
                    print(f"DNS resolution failed for {smtp_server}: {dns_error}")
                    raise socket.gaierror(f"DNS resolution timeout for {smtp_server}")
                
                # Use eventlet timeout for the entire SMTP operation
                with eventlet.Timeout(current_timeout):
                    # Create SMTP connection step by step
                    server = smtplib.SMTP()
                    server.connect(smtp_server, smtp_port)
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.sendmail(smtp_username, to, msg.as_string())
                    server.quit()
            else:
                # Use standard socket with timeout
                old_timeout = socket.getdefaulttimeout()
                socket.setdefaulttimeout(current_timeout)
                try:
                    server = smtplib.SMTP(smtp_server, smtp_port, timeout=current_timeout)
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.sendmail(smtp_username, to, msg.as_string())
                    server.quit()
                finally:
                    socket.setdefaulttimeout(old_timeout)
            
            print(f"✓ Email sent successfully to {to} via {smtp_server}")
            return True
            
        except (socket.timeout, socket.gaierror, OSError, eventlet.Timeout, ConnectionError) as e:
            last_error = e
            servers_tried.add(smtp_server)
            error_type = "DNS/Network"
            if isinstance(e, eventlet.Timeout):
                error_type = "Eventlet Timeout"
            elif isinstance(e, socket.gaierror):
                error_type = "DNS Resolution"
            elif isinstance(e, ConnectionError):
                error_type = "Connection"
            
            error_msg = f"✗ {error_type} error on attempt {attempt + 1} with {smtp_server}: {str(e)}"
            print(error_msg)
            
            # If this attempt failed, try next server for next attempt
            if attempt < max_retries - 1:
                # Move to next server
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                next_server = SMTP_SERVERS[current_server_index]['server']
                
                # If we've tried all servers, reset the cycle but increase wait time
                if len(servers_tried) >= len(SMTP_SERVERS):
                    print("All servers tried, resetting server cycle...")
                    servers_tried.clear()
                    current_server_index = 0
                
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"Next attempt will use {next_server}, waiting {wait_time} seconds...")
                
                if is_eventlet_patched():
                    eventlet.sleep(wait_time)
                else:
                    time.sleep(wait_time)
            
        except smtplib.SMTPException as e:
            last_error = e
            error_msg = f"✗ SMTP error on attempt {attempt + 1} with {smtp_server}: {str(e)}"
            print(error_msg)
            
            if attempt < max_retries - 1:
                # Move to next server for SMTP errors too
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                wait_time = 2 ** attempt
                print(f"Waiting {wait_time} seconds before retry with next server...")
                
                if is_eventlet_patched():
                    eventlet.sleep(wait_time)
                else:
                    time.sleep(wait_time)
                
        except Exception as e:
            last_error = e
            print(f"✗ Unexpected error on attempt {attempt + 1} with {smtp_server}: {str(e)}")
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                if is_eventlet_patched():
                    eventlet.sleep(1)
                else:
                    time.sleep(1)
    
    # If all attempts failed
    error_message = f"Failed to send email after {max_retries} attempts across {len(servers_tried)} different servers. Last error: {str(last_error)}"
    print(error_message)
    raise Exception(f"Email sending failed after {max_retries} attempts: {str(last_error)}")
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                if is_eventlet_patched():
                    eventlet.sleep(1)
                else:
                    time.sleep(1)
    
    # If all attempts failed
    error_message = f"Failed to send email after {max_retries} attempts across {len(servers_tried)} different servers. Last error: {str(last_error)}"
    print(error_message)
    raise Exception(f"Email sending failed after {max_retries} attempts: {str(last_error)}")

def send_email_with_eventlet_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Attempt to send email with eventlet-compatible fallback strategy
    Returns True if successful, False if all methods fail
    """
    try:
        # Primary attempt with eventlet-compatible networking
        send_email_eventlet(to, subject, body, max_retries=2, timeout=timeout)
        return True
    except Exception as primary_error:
        print(f"Primary eventlet-compatible email sending failed: {str(primary_error)}")
        
        # Fallback: Try with different timeout and retry settings
        try:
            fallback_timeout = max(8, timeout - 5)  # Reduce timeout for fallback
            print(f"Attempting with reduced timeout ({fallback_timeout}s) and single retry...")
            send_email_eventlet(to, subject, body, max_retries=1, timeout=fallback_timeout)
            return True
        except Exception as fallback_error:
            print(f"All eventlet-compatible email sending attempts failed:")
            print(f"   Primary error: {str(primary_error)}")
            print(f"   Fallback error: {str(fallback_error)}")
            return False

def send_email_in_eventlet_background(to: str, subject: str, body: str, callback=None):
    """
    Send email in an eventlet green thread to avoid blocking the main application
    """
    def email_worker():
        try:
            result = send_email_with_eventlet_fallback(to, subject, body)
            if callback:
                callback(result, None)
        except Exception as e:
            if callback:
                callback(False, str(e))
    
    if is_eventlet_patched():
        # Use eventlet green thread
        eventlet.spawn(email_worker)
    else:
        # Use regular thread
        thread = threading.Thread(target=email_worker, daemon=True)
        thread.start()
        return thread

# Compatibility functions that auto-detect eventlet and use appropriate method
def send_email_with_local_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Smart email sending that automatically detects eventlet and uses appropriate method
    """
    eventlet_detected = is_eventlet_patched()
    print(f"Eventlet detection result: {eventlet_detected}")
    
    if eventlet_detected:
        print("Eventlet detected, using eventlet-compatible email sending...")
        return send_email_with_eventlet_fallback(to, subject, body, timeout)
    else:
        print("Standard environment detected, using original email sending...")
        # Import and use the original Email1 functions
        from app.utils.Email1 import send_email_with_local_fallback as original_send
        return original_send(to, subject, body, timeout)

def send_email_async(to: str, subject: str, body: str):
    """
    Smart async email sending that automatically detects eventlet
    """
    return send_email_with_local_fallback(to, subject, body)

def send_email_in_background(to: str, subject: str, body: str, callback=None):
    """
    Smart background email sending that automatically detects eventlet
    """
    if is_eventlet_patched():
        return send_email_in_eventlet_background(to, subject, body, callback)
    else:
        # Import and use the original Email1 functions
        from app.utils.Email1 import send_email_in_background as original_background
        return original_background(to, subject, body, callback)
