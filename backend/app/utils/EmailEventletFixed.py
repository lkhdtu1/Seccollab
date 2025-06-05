import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import time
import socket
import threading
from typing import List, Dict, Tuple

# Try to import eventlet components, but make it optional
try:
    import eventlet
    from eventlet.green import socket as green_socket
    EVENTLET_AVAILABLE = True
except ImportError:
    EVENTLET_AVAILABLE = False
    eventlet = None
    green_socket = None

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
    if not EVENTLET_AVAILABLE:
        return False
    
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

def send_email_with_eventlet(to: str, subject: str, body: str, max_retries: int = 3, timeout: int = 20):
    """
    Send email using eventlet-compatible methods
    """
    if not isinstance(subject, str):
        raise ValueError("Le sujet (subject) doit être une chaîne de caractères")

    # Get SMTP configuration from environment or use defaults
    smtp_username = os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')
    smtp_password = os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')

    current_server_index = 0
    servers_tried = set()
    
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    last_error = None
    
    for attempt in range(max_retries):
        server_config = SMTP_SERVERS[current_server_index]
        smtp_server = server_config['server']
        smtp_port = server_config['port']
        current_timeout = timeout if attempt == 0 else max(8, timeout - (attempt * 3))
        
        try:
            print(f"Attempting email to {to} (attempt {attempt + 1}/{max_retries}) via {smtp_server}:{smtp_port} (timeout: {current_timeout}s)")
            
            # Use a more aggressive timeout approach for eventlet
            def send_email_worker():
                server = smtplib.SMTP()
                server.connect(smtp_server, smtp_port)
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, to, msg.as_string())
                server.quit()
                return True
            
            if EVENTLET_AVAILABLE and eventlet:
                # Use eventlet spawn with timeout
                try:
                    with eventlet.Timeout(current_timeout):
                        result = send_email_worker()
                        if result:
                            print(f"✓ Email sent successfully to {to} via {smtp_server}")
                            return True
                except eventlet.Timeout:
                    raise socket.timeout(f"Eventlet timeout after {current_timeout} seconds")
            else:
                # Fallback for non-eventlet environments
                result = send_email_worker()
                if result:
                    print(f"✓ Email sent successfully to {to} via {smtp_server}")
                    return True
            
        except (socket.timeout, socket.gaierror, OSError, ConnectionError) as e:
            if EVENTLET_AVAILABLE and hasattr(e, '__class__') and 'Timeout' in e.__class__.__name__:
                error_type = "Eventlet Timeout"
            elif isinstance(e, socket.gaierror):
                error_type = "DNS Resolution"
            elif isinstance(e, socket.timeout):
                error_type = "Socket Timeout"
            else:
                error_type = "Network"
            
            last_error = e
            servers_tried.add(smtp_server)
            print(f"✗ {error_type} error on attempt {attempt + 1} with {smtp_server}: {str(e)}")
            
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                next_server = SMTP_SERVERS[current_server_index]['server']
                
                if len(servers_tried) >= len(SMTP_SERVERS):
                    print("All servers tried, resetting server cycle...")
                    servers_tried.clear()
                    current_server_index = 0
                
                wait_time = 1 + attempt  # Simple linear backoff
                print(f"Next attempt will use {next_server}, waiting {wait_time} seconds...")
                
                if EVENTLET_AVAILABLE and eventlet and is_eventlet_patched():
                    eventlet.sleep(wait_time)
                else:
                    time.sleep(wait_time)
                    
        except smtplib.SMTPException as e:
            last_error = e
            print(f"✗ SMTP error on attempt {attempt + 1} with {smtp_server}: {str(e)}")
            
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                wait_time = 1 + attempt
                print(f"Waiting {wait_time} seconds before retry with next server...")
                
                if EVENTLET_AVAILABLE and eventlet and is_eventlet_patched():
                    eventlet.sleep(wait_time)
                else:
                    time.sleep(wait_time)
                    
        except Exception as e:
            last_error = e
            print(f"✗ Unexpected error on attempt {attempt + 1} with {smtp_server}: {str(e)}")
            if attempt < max_retries - 1:
                current_server_index = (current_server_index + 1) % len(SMTP_SERVERS)
                if EVENTLET_AVAILABLE and eventlet and is_eventlet_patched():
                    eventlet.sleep(1)
                else:
                    time.sleep(1)
    
    error_message = f"Failed to send email after {max_retries} attempts across {len(servers_tried)} different servers. Last error: {str(last_error)}"
    print(error_message)
    raise Exception(f"Email sending failed after {max_retries} attempts: {str(last_error)}")

def send_email_with_local_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Smart email sending that automatically detects eventlet and uses appropriate method
    """
    eventlet_detected = is_eventlet_patched()
    print(f"Eventlet detection result: {eventlet_detected}")
    
    if eventlet_detected:
        print("Eventlet detected, using eventlet-compatible email sending...")
        try:
            send_email_with_eventlet(to, subject, body, max_retries=2, timeout=timeout)
            return True
        except Exception as primary_error:
            print(f"Eventlet-compatible email sending failed: {str(primary_error)}")
            
            # Fallback: Try with reduced timeout
            try:
                fallback_timeout = max(8, timeout - 5)
                print(f"Attempting with reduced timeout ({fallback_timeout}s) and single retry...")
                send_email_with_eventlet(to, subject, body, max_retries=1, timeout=fallback_timeout)
                return True
            except Exception as fallback_error:
                print(f"All eventlet-compatible email sending attempts failed:")
                print(f"   Primary error: {str(primary_error)}")
                print(f"   Fallback error: {str(fallback_error)}")
                return False
    else:
        print("Standard environment detected, using original email sending...")
        # Import and use the original Email1 functions
        try:
            from app.utils.Email1 import send_email_with_local_fallback as original_send
            return original_send(to, subject, body, timeout)
        except ImportError:
            # If Email1 is not available, use eventlet method as fallback
            print("Original Email1 not available, using eventlet method as fallback...")
            try:
                send_email_with_eventlet(to, subject, body, max_retries=2, timeout=timeout)
                return True
            except Exception as e:
                print(f"Fallback email sending failed: {str(e)}")
                return False

def send_email_async(to: str, subject: str, body: str):
    """
    Smart async email sending that automatically detects eventlet
    """
    return send_email_with_local_fallback(to, subject, body)

def send_email_in_background(to: str, subject: str, body: str, callback=None):
    """
    Smart background email sending that automatically detects eventlet
    """
    def email_worker():
        try:
            result = send_email_with_local_fallback(to, subject, body)
            if callback:
                callback(result, None)
        except Exception as e:
            if callback:
                callback(False, str(e))
    
    if EVENTLET_AVAILABLE and eventlet and is_eventlet_patched():
        # Use eventlet green thread
        eventlet.spawn(email_worker)
    else:
        # Use regular thread
        thread = threading.Thread(target=email_worker, daemon=True)
        thread.start()
        return thread
