import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import { API_BASE_URL } from '../config/config'; // Importer la configuration
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();



  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/oauth/google/login`);
      const data = await response.json();
      window.location.href = data.auth_url; // Redirige vers Google OAuth
      // Stockez les tokens dans le localStorage ou un autre endroit sécurisé
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
  
      // Redirigez l'utilisateur vers le hub
      navigate('/hub'); // Assurez-vous que cette route existe
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      // Appeler l'API Flask pour authentifier l'utilisateur
      const response = await fetch(`${API_BASE_URL}/auth/login`, { // Utiliser API_BASE_URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Stocker le token et les informations utilisateur dans localStorage
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
  
        // Rediriger vers le tableau de bord
        navigate('/hub');
      } else {
        // Gérer les erreurs d'authentification
        setError(data.msg || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
      console.error('Erreur de connexion:', err);
    }
  };

  /*
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Ici, nous simulerons l'authentification
      // Dans une implémentation réelle, cela serait connecté au backend Flask
      console.log('Tentative de connexion avec:', { email, password });
      
      // Simulation d'une réponse d'API
      const response = { 
        success: true, 
        token: 'jwt-token-example',
        user: { id: 1, email, name: 'Utilisateur Test' }
      };
      
      if (response.success) {
        // Stocker le token dans localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Rediriger vers le tableau de bord
        navigate('/hub');
      }
    } catch (err) {
      setError('Échec de la connexion. Veuillez vérifier vos identifiants.');
      console.error('Erreur de connexion:', err);
    }
  };
*/
  return (
    <div className="flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Connexion</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Se connecter
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Pas encore de compte? <a href="/register" className="text-blue-500 hover:text-blue-700">S'inscrire</a>
          </p>
        </div>

        <div>
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </div>

        <div>
      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white py-2 px-4 rounded"
      >
        Connexion avec Google
      </button>
    </div>
      </div>
    </div>
  );
};

export default Login;
