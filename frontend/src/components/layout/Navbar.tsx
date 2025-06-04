import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // Supprimer les informations d'authentification
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold ">SecCollab</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                
                
                <Link to="/profile" className="hover:text-green-200">Profil</Link>
                <Link to="/Trash" className="hover:text-yellow-200">Trash</Link>
                <span className="text-blue-200">Bonjour, {user.name || 'Utilisateur'}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Connexion</Link>
                <Link to="/register" className="bg-white text-blue-600 hover:bg-blue-100 py-1 px-3 rounded">Inscription</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
