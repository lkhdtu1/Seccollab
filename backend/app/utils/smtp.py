from Email1 import send_email
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
send_email(
    to="ytest722@gmail.com",
    subject="Test Email",
    body="Ceci est un email de test envoyé depuis Python."
)

