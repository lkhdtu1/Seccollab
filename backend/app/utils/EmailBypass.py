import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import time
import socket
import threading
import subprocess
import sys
import json
from typing import List, Dict, Tuple
import multiprocessing
from multiprocessing import Process, Queue

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
        return eventlet.patcher.is_monkey_patched('socket')
    except (ImportError, AttributeError):
        return False

def send_email_subprocess(to: str, subject: str, body: str, timeout: int = 30) -> bool:
    """
    Send email using a subprocess to completely bypass eventlet
    """
    try:
        # Create a Python script that will run in a separate process
        email_script = f'''
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import socket
import sys
import json

def send_email_clean():
    try:
        smtp_username = "{os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')}"
        smtp_password = "{os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')}"
        
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = "{to}"
        msg['Subject'] = "{subject}"
        msg.attach(MIMEText("""{body}""", 'plain', 'utf-8'))
        
        # Try Gmail first
        socket.setdefaulttimeout(15)
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, "{to}", msg.as_string())
        server.quit()
        
        print("SUCCESS")
        return True
    except Exception as e:
        print(f"ERROR: {{str(e)}}")
        return False

if __name__ == "__main__":
    send_email_clean()
'''
        
        # Write the script to a temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(email_script)
            script_path = f.name
        
        try:
            # Run the script in a subprocess with timeout
            print(f"Sending email via subprocess (timeout: {timeout}s)...")
            result = subprocess.run([
                sys.executable, script_path
            ], capture_output=True, text=True, timeout=timeout)
            
            if result.returncode == 0 and "SUCCESS" in result.stdout:
                print(f"✓ Subprocess email sent successfully to {to}")
                return True
            else:
                print(f"✗ Subprocess email failed: {result.stdout} {result.stderr}")
                return False
                
        finally:
            # Clean up the temporary script file
            try:
                os.unlink(script_path)
            except:
                pass
                
    except subprocess.TimeoutExpired:
        print(f"✗ Subprocess timeout after {timeout} seconds")
        return False
    except Exception as e:
        print(f"✗ Subprocess error: {str(e)}")
        return False

def send_email_multiprocess(to: str, subject: str, body: str, timeout: int = 30) -> bool:
    """
    Send email using multiprocessing to bypass eventlet
    """
    def email_worker(queue, to, subject, body):
        try:
            # This runs in a separate process, no eventlet interference
            smtp_username = os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')
            smtp_password = os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')
            
            msg = MIMEMultipart()
            msg['From'] = smtp_username
            msg['To'] = to
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Set a reasonable socket timeout
            socket.setdefaulttimeout(15)
            
            # Try Gmail first
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, to, msg.as_string())
            server.quit()
            
            queue.put(('SUCCESS', f'Email sent to {to}'))
        except Exception as e:
            queue.put(('ERROR', str(e)))
    
    try:
        # Create a queue for communication
        queue = Queue()
        
        # Start the email process
        process = Process(target=email_worker, args=(queue, to, subject, body))
        process.start()
        
        # Wait for the process to complete with timeout
        process.join(timeout=timeout)
        
        if process.is_alive():
            # Process is still running, terminate it
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                process.kill()
            print(f"✗ Multiprocess timeout after {timeout} seconds")
            return False
        
        # Check the result
        if not queue.empty():
            status, message = queue.get()
            if status == 'SUCCESS':
                print(f"✓ Multiprocess email sent successfully: {message}")
                return True
            else:
                print(f"✗ Multiprocess email failed: {message}")
                return False
        else:
            print("✗ No response from email process")
            return False
            
    except Exception as e:
        print(f"✗ Multiprocess error: {str(e)}")
        return False

def send_email_thread_bypass(to: str, subject: str, body: str, timeout: int = 30) -> bool:
    """
    Send email using a thread with original socket module (before eventlet patching)
    """
    import threading
    import queue
    
    result_queue = queue.Queue()
    
    def email_worker():
        try:
            # Save current socket module
            import socket
            current_socket = socket.socket
            
            # Try to restore original socket if available
            if hasattr(socket, '_original_socket'):
                socket.socket = socket._original_socket
            
            try:
                smtp_username = os.getenv('MAIL_USERNAME', 'cyborgtm1234@gmail.com')
                smtp_password = os.getenv('MAIL_PASSWORD', 'swwfhdtihpzfrxsf')
                
                msg = MIMEMultipart()
                msg['From'] = smtp_username
                msg['To'] = to
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain', 'utf-8'))
                
                # Set socket timeout
                old_timeout = socket.getdefaulttimeout()
                socket.setdefaulttimeout(15)
                
                try:
                    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.sendmail(smtp_username, to, msg.as_string())
                    server.quit()
                    result_queue.put(('SUCCESS', f'Email sent to {to}'))
                finally:
                    socket.setdefaulttimeout(old_timeout)
                    
            finally:
                # Restore eventlet socket
                socket.socket = current_socket
                
        except Exception as e:
            result_queue.put(('ERROR', str(e)))
    
    try:
        # Start the thread
        thread = threading.Thread(target=email_worker, daemon=True)
        thread.start()
        
        # Wait for completion with timeout
        thread.join(timeout=timeout)
        
        if thread.is_alive():
            print(f"✗ Thread timeout after {timeout} seconds")
            return False
        
        # Check result
        if not result_queue.empty():
            status, message = result_queue.get()
            if status == 'SUCCESS':
                print(f"✓ Thread bypass email sent successfully: {message}")
                return True
            else:
                print(f"✗ Thread bypass email failed: {message}")
                return False
        else:
            print("✗ No response from email thread")
            return False
            
    except Exception as e:
        print(f"✗ Thread bypass error: {str(e)}")
        return False

def send_email_with_bypass_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Smart email sending that bypasses eventlet completely when detected
    """
    if is_eventlet_patched():
        print("Eventlet detected - using bypass methods...")
        
        # Method 1: Try subprocess (most reliable)
        try:
            print("Attempting subprocess method...")
            if send_email_subprocess(to, subject, body, timeout):
                return True
        except Exception as e:
            print(f"Subprocess method failed: {str(e)}")
        
        # Method 2: Try multiprocessing
        try:
            print("Attempting multiprocessing method...")
            if send_email_multiprocess(to, subject, body, timeout):
                return True
        except Exception as e:
            print(f"Multiprocessing method failed: {str(e)}")
        
        # Method 3: Try thread with socket bypass
        try:
            print("Attempting thread bypass method...")
            if send_email_thread_bypass(to, subject, body, timeout):
                return True
        except Exception as e:
            print(f"Thread bypass method failed: {str(e)}")
        
        print("All bypass methods failed")
        return False
    else:
        print("Standard environment detected, using original email sending...")
        try:
            from app.utils.Email1 import send_email_with_local_fallback as original_send
            return original_send(to, subject, body, timeout)
        except ImportError:
            print("Original Email1 not available, trying subprocess fallback...")
            return send_email_subprocess(to, subject, body, timeout)

# Main interface functions
def send_email_with_local_fallback(to: str, subject: str, body: str, timeout: int = 15) -> bool:
    """
    Primary interface for email sending with eventlet bypass capability
    """
    return send_email_with_bypass_fallback(to, subject, body, timeout)

def send_email_async(to: str, subject: str, body: str):
    """
    Async email sending interface
    """
    return send_email_with_local_fallback(to, subject, body)

def send_email_in_background(to: str, subject: str, body: str, callback=None):
    """
    Background email sending interface
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
