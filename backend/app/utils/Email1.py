import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import time
import socket
import threading
from typing import List, Dict, Tuple

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

def test_dns_resolution(hostname: str, timeout: int = 5) -> bool:
    """Test if we can resolve the hostname"""
    try:
        socket.setdefaulttimeout(timeout)
        socket.gethostbyname(hostname)
        return True
    except (socket.gaierror, socket.timeout):
        return False
    finally:
        socket.setdefaulttimeout(None)

def get_available_smtp_server() -> Dict:
    """Find the first available SMTP server by testing all servers"""
    print(f"Testing DNS resolution for {len(SMTP_SERVERS)} SMTP servers...")
    
    for i, server_config in enumerate(SMTP_SERVERS):
        server_name = server_config['server']
        print(f"Testing server {i+1}/{len(SMTP_SERVERS)}: {server_name}")
        
        if test_dns_resolution(server_name):
            print(f"✓ DNS resolution successful for {server_name}")
            return server_config
        else:
            print(f"✗ DNS resolution failed for {server_name}")
    
    # If no server resolves, return the first one as fallback
    print("⚠ No SMTP servers resolved successfully, using first server as fallback")
    return SMTP_SERVERS[0]

def get_next_smtp_server(current_server: str) -> Dict:
    """Get the next SMTP server in the list, cycling through all servers"""
    current_index = 0
    for i, server_config in enumerate(SMTP_SERVERS):
        if server_config['server'] == current_server:
            current_index = i
            break
    
    # Get next server (cycling back to start if at end)
    next_index = (current_index + 1) % len(SMTP_SERVERS)
    return SMTP_SERVERS[next_index]

def send_email(to: str, subject: str, body: str, max_retries: int = 3, timeout: int = 30):
    """
    Send email with retry logic, timeout handling, and multiple SMTP server fallback
    
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

    # Set default timeout for socket operations
    original_timeout = socket.getdefaulttimeout()
    
    last_error = None
    
    for attempt in range(max_retries):
        # Get current server configuration
        server_config = SMTP_SERVERS[current_server_index]
        smtp_server = server_config['server']
        smtp_port = server_config['port']
        current_timeout = timeout if attempt == 0 else max(10, timeout - (attempt * 5))
        
        try:
            socket.setdefaulttimeout(current_timeout)
            print(f"Attempting to send email to {to} (attempt {attempt + 1}/{max_retries}) via {smtp_server}:{smtp_port} (timeout: {current_timeout}s)")
            
            # Create SMTP connection with explicit timeout
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=current_timeout)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, to, msg.as_string())
            server.quit()
            
            print(f"✓ Email sent successfully to {to} via {smtp_server}")
            return True
            
        except (socket.timeout, socket.gaierror, OSError) as e:
            last_error = e
            servers_tried.add(smtp_server)
            error_msg = f"✗ DNS/Network error on attempt {attempt + 1} with {smtp_server}: {str(e)}"
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
                time.sleep(wait_time)
                
        except Exception as e:
            last_error = e
            print(f"✗ Unexpected error on attempt {attempt + 1} with {smtp_server}: {str(e)}")
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                time.sleep(1)
        finally:
            # Restore original timeout
            socket.setdefaulttimeout(original_timeout)
    
    # If all attempts failed
    error_message = f"Failed to send email after {max_retries} attempts across {len(servers_tried)} different servers. Last error: {str(last_error)}"
    print(error_message)
    raise Exception(f"Email sending failed after {max_retries} attempts: {str(last_error)}")

def send_email_with_local_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Attempt to send email with comprehensive fallback strategy
    Returns True if successful, False if all methods fail
    """
    try:
        # Primary attempt with multiple servers
        send_email(to, subject, body, max_retries=2, timeout=timeout)
        return True
    except Exception as primary_error:
        print(f"Primary email sending failed: {str(primary_error)}")
        
        # Fallback: Try with different timeout and retry settings
        try:
            fallback_timeout = max(8, timeout - 5)  # Reduce timeout for fallback
            print(f"Attempting with reduced timeout ({fallback_timeout}s) and single retry...")
            send_email(to, subject, body, max_retries=1, timeout=fallback_timeout)
            return True
        except Exception as fallback_error:
            print(f"All email sending attempts failed:")
            print(f"   Primary error: {str(primary_error)}")
            print(f"   Fallback error: {str(fallback_error)}")
            return False

def send_email_async(to: str, subject: str, body: str):
    """
    Attempt to send email without blocking the main thread with comprehensive fallback
    Returns True if successful, False if failed
    """
    return send_email_with_local_fallback(to, subject, body)

def send_email_in_background(to: str, subject: str, body: str, callback=None):
    """
    Send email in a background thread to avoid blocking the main application
    """
    def email_worker():
        try:
            result = send_email_with_local_fallback(to, subject, body)
            if callback:
                callback(result, None)
        except Exception as e:
            if callback:
                callback(False, str(e))
    
    thread = threading.Thread(target=email_worker, daemon=True)
    thread.start()
    return thread