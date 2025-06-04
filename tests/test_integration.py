import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import subprocess
import signal
import requests

class TestSecurityIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Démarrer le serveur backend en arrière-plan
        cls.backend_process = subprocess.Popen(
            ["python", "main.py"],
            cwd=os.path.join(os.getcwd(), "backend"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Démarrer le serveur frontend en arrière-plan
        cls.frontend_process = subprocess.Popen(
            ["npm", "start"],
            cwd=os.path.join(os.getcwd(), "frontend"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Attendre que les serveurs démarrent
        time.sleep(10)
        
        # Configurer le navigateur headless pour les tests
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(10)
    
    @classmethod
    def tearDownClass(cls):
        # Fermer le navigateur
        cls.driver.quit()
        
        # Arrêter les serveurs
        cls.backend_process.send_signal(signal.SIGTERM)
        cls.frontend_process.send_signal(signal.SIGTERM)
        
        cls.backend_process.wait()
        cls.frontend_process.wait()
    
    def test_01_register_and_login(self):
        """Test d'inscription et de connexion d'un utilisateur"""
        self.driver.get("http://localhost:3000/register")
        
        # Remplir le formulaire d'inscription
        self.driver.find_element(By.ID, "name").send_keys("Test User")
        self.driver.find_element(By.ID, "email").send_keys("testuser@example.com")
        self.driver.find_element(By.ID, "password").send_keys("SecurePassword123!")
        self.driver.find_element(By.ID, "confirmPassword").send_keys("SecurePassword123!")
        
        # Soumettre le formulaire
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'S'inscrire')]").click()
        
        # Attendre la redirection vers la page de connexion
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("/login")
        )
        
        # Remplir le formulaire de connexion
        self.driver.find_element(By.ID, "email").send_keys("testuser@example.com")
        self.driver.find_element(By.ID, "password").send_keys("SecurePassword123!")
        
        # Soumettre le formulaire
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Se connecter')]").click()
        
        # Attendre la redirection vers le tableau de bord
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("/hub")
        )
        
        # Vérifier que l'utilisateur est connecté
        welcome_text = self.driver.find_element(By.XPATH, "//p[contains(text(), 'Bienvenue')]").text
        self.assertIn("Test User", welcome_text)
    
    def test_02_weak_password_rejection(self):
        """Test de rejet des mots de passe faibles"""
        self.driver.get("http://localhost:3000/register")
        
        # Remplir le formulaire avec un mot de passe faible
        self.driver.find_element(By.ID, "name").send_keys("Weak User")
        self.driver.find_element(By.ID, "email").send_keys("weakuser@example.com")
        self.driver.find_element(By.ID, "password").send_keys("password")  # Mot de passe faible
        self.driver.find_element(By.ID, "confirmPassword").send_keys("password")
        
        # Soumettre le formulaire
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'S'inscrire')]").click()
        
        # Vérifier que l'erreur de mot de passe faible est affichée
        error_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'error')]"))
        ).text
        
        self.assertIn("mot de passe", error_message.lower())
    
    def test_03_file_upload_and_sharing(self):
        """Test de téléversement et de partage de fichier"""
        # Se connecter d'abord
        self.driver.get("http://localhost:3000/login")
        self.driver.find_element(By.ID, "email").send_keys("testuser@example.com")
        self.driver.find_element(By.ID, "password").send_keys("SecurePassword123!")
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Se connecter')]").click()
        
        # Attendre la redirection vers le tableau de bord
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("/hub")
        )
        
        # Naviguer vers la page des fichiers
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Fichiers')]").click()
        
        # Téléverser un fichier
        file_input = self.driver.find_element(By.ID, "file-upload")
        file_path = os.path.abspath("test_file.txt")
        
        # Créer un fichier de test s'il n'existe pas
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                f.write("Contenu de test pour le fichier")
        
        file_input.send_keys(file_path)
        
        # Cliquer sur le bouton de téléversement
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Téléverser')]").click()
        
        # Vérifier que le fichier a été téléversé
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'test_file.txt')]"))
        )
        
        # Partager le fichier
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Partager')]").click()
        
        # Remplir le formulaire de partage
        share_modal = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'modal')]"))
        )
        
        share_modal.find_element(By.ID, "share-email").send_keys("otheruser@example.com")
        share_modal.find_element(By.XPATH, "//button[contains(text(), 'Partager')]").click()
        
        # Vérifier le message de succès
        success_message = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'success')]"))
        ).text
        
        self.assertIn("partagé", success_message.lower())
    
    def test_04_api_security(self):
        """Test de sécurité des API"""
        # Tester l'accès à une API protégée sans token
        response = requests.get("http://localhost:5000/api/files/list")
        self.assertEqual(response.status_code, 401)  # Unauthorized
        
        # Se connecter pour obtenir un token
        login_data = {
            "email": "testuser@example.com",
            "password": "SecurePassword123!"
        }
        response = requests.post("http://localhost:5000/api/auth/login", json=login_data)
        self.assertEqual(response.status_code, 200)
        
        token = response.json().get("access_token")
        self.assertIsNotNone(token)
        
        # Tester l'accès à une API protégée avec token
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://localhost:5000/api/files/list", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Tester l'accès à une API protégée avec un token invalide
        headers = {"Authorization": "Bearer invalid-token"}
        response = requests.get("http://localhost:5000/api/files/list", headers=headers)
        self.assertNotEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
