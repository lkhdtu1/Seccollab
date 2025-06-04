import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock de `react-router-dom` dans les tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  BrowserRouter: ({ children }) => <div>{children}</div>, // Si nécessaire pour contourner l'erreur
}));

// setupTests.js
console.warn = jest.fn();  // This suppresses console warnings during tests
