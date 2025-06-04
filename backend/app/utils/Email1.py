import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email(to: str, subject: str, body: str):
    if not isinstance(subject, str):
        raise ValueError("Le sujet (subject) doit être une chaîne de caractères")

    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USERNAME = "cyborgtm1234@gmail.com"
    SMTP_PASSWORD = "swwfhdtihpzfrxsf"

    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to, msg.as_string())
        print(f"Email envoyé avec succès à {to}")
        server.quit()
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email : {e}")