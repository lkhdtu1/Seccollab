import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RealtimeCollaboration from '../components/collaboration/RealtimeCollaboration';
import CollaborationHub from '../components/collaboration/CollaborationHub';

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});



const fileInput = screen.getByLabelText(/Choisir un fichier/i); 





// Tests de rendu des composants
describe('Composants de collaboration', () => {
  beforeEach(() => {
    // Simuler un utilisateur connecté
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }));
    localStorage.setItem('token', 'fake-token');
  });

  test('Le composant de collaboration en temps réel s\'affiche correctement', () => {
    render(<RealtimeCollaboration />);
    
    expect(screen.getByText(/Collaboration en Temps Réel/i)).toBeInTheDocument();
    expect(screen.getByText(/Fichiers partagés/i)).toBeInTheDocument();
    expect(screen.getByText(/Collaborateurs/i)).toBeInTheDocument();
    expect(screen.getByText(/Activité en cours/i)).toBeInTheDocument();
  });

  test('Le hub de collaboration s\'affiche correctement', () => {
    render(
      <BrowserRouter>
        <CollaborationHub />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Plateforme Collaborative Sécurisée/i)).toBeInTheDocument();
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    expect(screen.getByText(/Fichiers/i)).toBeInTheDocument();
    expect(screen.getByText(/Recherche avancée/i)).toBeInTheDocument();
    expect(screen.getByText(/Permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/Collaboration/i)).toBeInTheDocument();
  });

  test('La navigation entre les onglets fonctionne correctement', () => {
    render(
      <BrowserRouter>
        <CollaborationHub />
      </BrowserRouter>
    );
    
    // Vérifier que l'onglet Tableau de bord est actif par défaut
    const dashboardTab = screen.getByRole('button', { name: /Tableau de bord/i });
    expect(dashboardTab).toHaveClass('border-blue-500');
    
    // Cliquer sur l'onglet Recherche avancée
    const searchTab = screen.getByRole('button', { name: /Recherche avancée/i });
    fireEvent.click(searchTab);
    
    // Vérifier que l'onglet Recherche avancée est maintenant actif
    expect(searchTab).toHaveClass('border-blue-500');
    expect(dashboardTab).not.toHaveClass('border-blue-500');
  });
});

// Tests d'intégration des fonctionnalités de collaboration
describe('Tests d\'intégration des fonctionnalités de collaboration', () => {
  test('Sélection d\'un fichier dans la collaboration en temps réel', () => {
    render(<RealtimeCollaboration />);
    
    // Vérifier que le message de sélection est affiché
    expect(screen.getByText(/Sélectionnez un fichier pour voir la discussion/i)).toBeInTheDocument();
    
    // Trouver et cliquer sur le premier fichier de la liste
    const fileItems = screen.getAllByText(/Partagé avec/i);
    if (fileItems.length > 0) {
      const fileItem = fileItems[0].closest('li');
      fireEvent.click(fileItem);
      
      // Vérifier que la zone de chat est maintenant active
      expect(screen.queryByText(/Sélectionnez un fichier pour voir la discussion/i)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tapez votre message/i)).toBeInTheDocument();
    }
  });

  test('Envoi d\'un message dans la collaboration en temps réel', async () => {
    render(<RealtimeCollaboration />);
    
    // Trouver et cliquer sur le premier fichier de la liste
    const fileItems = screen.getAllByText(/Partagé avec/i);
    if (fileItems.length > 0) {
      const fileItem = fileItems[0].closest('li');
      fireEvent.click(fileItem);
      
      // Saisir un message
      const messageInput = screen.getByPlaceholderText(/Tapez votre message/i);
      fireEvent.change(messageInput, {
        target: { value: 'Ceci est un message de test' }
      });
      
      // Envoyer le message
      const sendButton = screen.getByRole('button', { name: /Envoyer/i });
      fireEvent.click(sendButton);
      
      // Vérifier que le message a été ajouté
      await waitFor(() => {
        expect(screen.getByText(/Ceci est un message de test/i)).toBeInTheDocument();
      });
      
      // Vérifier que le champ de saisie a été vidé
      expect(messageInput.value).toBe('');
    }
  });
});
