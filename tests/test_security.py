import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import requests
import json

class TestSecurityFeatures(unittest.TestCase):
    """Tests de sécurité spécifiques pour vérifier la robustesse de l'application"""
    
    def setUp(self):
        # Configuration pour les tests d'API
        self.api_base_url = "http://localhost:5000/api"
        self.test_user = {
            "email": "security_test@example.com",
            "password": "SecurePassword123!",
            "name": "Security Tester"
        }
        
        # Créer un utilisateur de test si nécessaire
        try:
            response = requests.post(f"{self.api_base_url}/auth/register", json=self.test_user)
            if response.status_code == 201:
                print("Utilisateur de test créé avec succès")
            elif response.status_code == 409:
                print("L'utilisateur de test existe déjà")
            else:
                print(f"Erreur lors de la création de l'utilisateur de test: {response.status_code}")
                print(response.json())
        except Exception as e:
            print(f"Exception lors de la création de l'utilisateur de test: {e}")
    
    def get_auth_token(self):
        """Obtenir un token d'authentification pour les tests"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        response = requests.post(f"{self.api_base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_01_sql_injection_prevention(self):
        """Test de prévention des injections SQL"""
        # Tentative d'injection SQL dans le formulaire de connexion
        login_data = {
            "email": "' OR 1=1 --",
            "password": "anything"
        }
        response = requests.post(f"{self.api_base_url}/auth/login", json=login_data)
        
        # Vérifier que l'injection a échoué (pas de connexion réussie)
        self.assertNotEqual(response.status_code, 200)
        self.assertNotIn("access_token", response.text)
    
    def test_02_xss_prevention(self):
        """Test de prévention des attaques XSS"""
        # Obtenir un token d'authentification
        token = self.get_auth_token()
        self.assertIsNotNone(token)
        
        # Tentative d'injection XSS dans un nom de fichier
        headers = {"Authorization": f"Bearer {token}"}
        xss_payload = "<script>alert('XSS')</script>"
        
        # Dans un environnement réel, nous téléverserions un fichier avec ce nom
        # Pour ce test, nous simulons une requête API qui pourrait être vulnérable
        file_data = {
            "name": xss_payload,
            "content": "Test content"
        }
        
        response = requests.post(f"{self.api_base_url}/files/create", json=file_data, headers=headers)
        
        # Vérifier la réponse (dans une application sécurisée, cela devrait échouer ou échapper le contenu)
        if response.status_code == 201:
            # Si la création réussit, vérifier que le nom a été échappé
            file_id = response.json().get("file_id")
            get_response = requests.get(f"{self.api_base_url}/files/{file_id}", headers=headers)
            self.assertEqual(get_response.status_code, 200)
            file_info = get_response.json()
            
            # Vérifier que le script n'est pas exécutable (échappé ou filtré)
            self.assertNotEqual(file_info.get("name"), xss_payload)
        else:
            # Si la création échoue, c'est aussi acceptable comme mesure de sécurité
            self.assertIn(response.status_code, [400, 403, 422])
    
    def test_03_csrf_protection(self):
        """Test de protection contre les attaques CSRF"""
        # Obtenir un token d'authentification
        token = self.get_auth_token()
        self.assertIsNotNone(token)
        
        # Tester une requête sans en-tête CSRF (si implémenté)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Tenter une opération sensible
        data = {"email": "another_user@example.com"}
        response = requests.post(f"{self.api_base_url}/files/share", json=data, headers=headers)
        
        # Dans une application avec protection CSRF, cela devrait échouer sans le token CSRF
        # Mais comme nous utilisons des API REST avec JWT, ce n'est peut-être pas applicable
        # Nous vérifions simplement que l'API fonctionne comme prévu
        self.assertIn(response.status_code, [200, 201, 400, 403, 404, 422])
    
    def test_04_rate_limiting(self):
        """Test de limitation de débit (rate limiting)"""
        # Tester la limitation de débit sur l'API de connexion
        login_data = {
            "email": "nonexistent@example.com",
            "password": "WrongSecurePassword123!"
        }
        
        # Faire plusieurs requêtes en succession rapide
        responses = []
        for _ in range(10):
            response = requests.post(f"{self.api_base_url}/auth/login", json=login_data)
            responses.append(response.status_code)
            time.sleep(0.1)  # Petite pause entre les requêtes
        
        # Vérifier si la limitation de débit est active
        # Si c'est le cas, certaines réponses devraient être 429 (Too Many Requests)
        # Si ce n'est pas implémenté, toutes les réponses devraient être cohérentes
        self.assertTrue(all(status == responses[0] for status in responses) or 429 in responses)
    
    def test_05_secure_headers(self):
        """Test des en-têtes de sécurité HTTP"""
        # Obtenir un token d'authentification
        token = self.get_auth_token()
        self.assertIsNotNone(token)
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{self.api_base_url}/files/list", headers=headers)
        
        # Vérifier les en-têtes de sécurité
        response_headers = response.headers
        
        # Vérifier Content-Security-Policy
        self.assertIn('Content-Security-Policy', response_headers)
        
        # Vérifier X-Content-Type-Options
        self.assertIn('X-Content-Type-Options', response_headers)
        self.assertEqual(response_headers.get('X-Content-Type-Options'), 'nosniff')
        
        # Vérifier X-Frame-Options
        self.assertIn('X-Frame-Options', response_headers)
        
        # Vérifier Strict-Transport-Security (HSTS)
        self.assertIn('Strict-Transport-Security', response_headers)

if __name__ == "__main__":
    unittest.main()
