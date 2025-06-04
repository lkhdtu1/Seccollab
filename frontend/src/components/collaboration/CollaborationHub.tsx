import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard';
import FileShare from '../files/FileShare';
import AdvancedSearch from '../files/AdvancedSearch';
import PermissionsManager from '../files/PermissionsManager';
import RealtimeCollaboration from './RealtimeCollaboration'; // Celui-là est dans le même dossier
import Navbar from '../layout/Navbar';
function CollaborationHub() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Plateforme Collaborative Sécurisée</h1>
          <p className="text-gray-600 mb-6">
            Bienvenue dans votre espace de travail collaboratif. Gérez vos fichiers, partagez des documents et collaborez en temps réel avec votre équipe.
          </p>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => handleTabChange('files')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Fichiers
              </button>
              <button
                onClick={() => handleTabChange('search')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'search'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recherche avancée
              </button>
              <button
                onClick={() => handleTabChange('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Permissions
              </button>
              <button
                onClick={() => handleTabChange('collaboration')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collaboration'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collaboration
              </button>
            </nav>
          </div>
        </div>
        
        <div className="mt-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'files' && <FileShare />}
          {activeTab === 'search' && <AdvancedSearch />}
          {activeTab === 'permissions' && <PermissionsManager />}
          {activeTab === 'collaboration' && <RealtimeCollaboration />}
        </div>
      </div>
    </div>
  );
}

export default CollaborationHub;
