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
    """Find the first available SMTP server"""
    for server_config in SMTP_SERVERS:
        if test_dns_resolution(server_config['server']):
            return server_config
    
    # If no server resolves, return the primary one (will handle error gracefully)
    return SMTP_SERVERS[0]

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
    primary_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    primary_port = int(os.getenv('MAIL_PORT', '587'))
    smtp_username = os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')
    smtp_password = os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')

    # Try to find an available SMTP server
    print(f"Testing SMTP server availability for {primary_server}...")
    if test_dns_resolution(primary_server, timeout=10):
        smtp_server = primary_server
        smtp_port = primary_port
        print(f"Primary server {primary_server} is accessible")
    else:
        print(f"Primary server {primary_server} not accessible, trying alternatives...")
        available_server = get_available_smtp_server()
        smtp_server = available_server['server']
        smtp_port = available_server['port']
        print(f"Using fallback server: {smtp_server}:{smtp_port}")

    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # Set default timeout for socket operations
    original_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(timeout)
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting to send email to {to} (attempt {attempt + 1}/{max_retries}) via {smtp_server}")
            
            # Create SMTP connection with explicit timeout
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=timeout)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, to, msg.as_string())
            server.quit()
            
            print(f"Email sent successfully to {to} via {smtp_server}")
            return True
            
        except (socket.timeout, socket.gaierror) as e:
            last_error = e
            error_msg = f"DNS/Network error on attempt {attempt + 1}: {str(e)}"
            print(error_msg)
            
            # If DNS fails, try a different server for next attempt
            if attempt < max_retries - 1:
                print("Trying alternative SMTP server for next attempt...")
                available_server = get_available_smtp_server()
                smtp_server = available_server['server']
                smtp_port = available_server['port']
                
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                print(f"Waiting {wait_time} seconds before retry with {smtp_server}...")
                time.sleep(wait_time)
            
        except smtplib.SMTPException as e:
            last_error = e
            error_msg = f"SMTP error on attempt {attempt + 1}: {str(e)}"
            print(error_msg)
            
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
                
        except Exception as e:
            last_error = e
            print(f"Unexpected error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)
        finally:
            # Restore original timeout
            socket.setdefaulttimeout(original_timeout)
    
    # If all attempts failed
    error_message = f"Failed to send email after {max_retries} attempts. Last error: {str(last_error)}"
    print(error_message)
    raise Exception(f"Email sending failed after {max_retries} attempts: {str(last_error)}")

def send_email_with_local_fallback(to: str, subject: str, body: str) -> bool:
    """
    Attempt to send email with comprehensive fallback strategy
    Returns True if successful, False if all methods fail
    """
    try:
        # Primary attempt with multiple servers
        send_email(to, subject, body, max_retries=2, timeout=15)
        return True
    except Exception as primary_error:
        print(f"Primary email sending failed: {str(primary_error)}")
        
        # Fallback: Try with different timeout and retry settings
        try:
            print("Attempting with reduced timeout and single retry...")
            send_email(to, subject, body, max_retries=1, timeout=10)
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