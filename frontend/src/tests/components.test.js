import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollaborationHub from '../components/collaboration/CollaborationHub'; // Assurez-vous que le bon composant est importé

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

// Mock des appels API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    ok: true,
    status: 200
  })
);

describe('Composants de collaboration', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  test('Le hub de collaboration s\'affiche correctement', () => {
    render(
      <BrowserRouter>
        <CollaborationHub />
      </BrowserRouter>
    );

    // Utiliser getAllByText pour gérer les éléments multiples avec le même texte
    const texts = screen.getAllByText(/Plateforme Collaborative Sécurisée/i);

    // Vérifier qu'il y a au moins un élément avec le texte attendu
    expect(texts.length).toBeGreaterThan(0);
    expect(texts[0]).toBeInTheDocument();  // Vérifier le premier élément trouvé

    // Ajouter d'autres assertions si nécessaire
    expect(screen.getByRole('heading', { name: /Plateforme Collaborative Sécurisée/i })).toBeInTheDocument();
  });

  test('Le fichier est sélectionné correctement', () => {
    render(
      <BrowserRouter>
        <CollaborationHub />
      </BrowserRouter>
    );
    
    // Simuler la sélection d'un fichier
    const fileInput = screen.getByLabelText(/Choisir un fichier/i);  // Vérifiez que ce libellé correspond exactement à celui dans votre composant
    expect(fileInput).toBeInTheDocument();  // Assurez-vous que l'élément est bien rendu

    fireEvent.change(fileInput, { target: { files: [new File(['file content'], 'rapport_financier.pdf')] } });

    // Vérifier que le fichier a été sélectionné
    expect(screen.getByText(/Fichier sélectionné: rapport_financier.pdf/i)).toBeInTheDocument();
  });

  test('Le message est envoyé correctement', async () => {
    render(
      <BrowserRouter>
        <CollaborationHub />
      </BrowserRouter>
    );
    
    // Utiliser le bon placeholder et vérifier sa présence
    const messageInput = screen.getByPlaceholderText(/Entrez votre message/i);  // Vérifiez que ce placeholder correspond exactement à celui dans votre composant
    expect(messageInput).toBeInTheDocument();  // Vérifier que l'élément est bien rendu

    fireEvent.change(messageInput, { target: { value: 'Ceci est un message de test' } });

    const sendButton = screen.getByRole('button', { name: /Envoyer/i });
    fireEvent.click(sendButton);

    // Vérifier que le message a été envoyé
    await waitFor(() => {
      expect(screen.getByText(/Message envoyé: Ceci est un message de test/i)).toBeInTheDocument();
    });
  });
});
