import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Connexion form', async () => {
  render(<App />);
  
  // Adjust the search to find the "Connexion" heading or form-related text
  const loginElement = await screen.findByText(/connexion/i); // Adjusted for actual text
  
  expect(loginElement).toBeInTheDocument();
});
