import unittest
from app import create_app
from app.utils.database import init_db, db  # Import the db instance
from app.models.user import User
from app.models.file import File
from app.models.file_share import FileShare
from app.utils.security import hash_password, check_password
import os
import tempfile
import json

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.sql import text  # Import the text function

class TestDB(unittest.TestCase):
    def setUp(self):
        """
        Configure the test environment and initialize the database.
        """
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        with self.app.app_context():
            init_db(self.app)  # Initialize the database only once
        self.client = self.app.test_client()

    def test_database_connection(self):
        """
        Vérifie que la connexion à la base de données fonctionne.
        """
        with self.app.app_context():
            try:
                # Use db.session to execute a simple query with text()
                result = db.session.execute(text('SELECT *')).fetchone()
                self.assertIsNotNone(result)
            except Exception as e:
                self.fail(f"Connexion à la base de données échouée : {str(e)}")